from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import io
import base64
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Headless backend — required for Linux cloud servers (no display)
import matplotlib.pyplot as plt

from services.auth import get_current_user

router = APIRouter()

class ManualDataRequest(BaseModel):
    column_names: List[str]
    rows: List[List[Any]]

class ChartRegenRequest(BaseModel):
    groups: List[str]
    parameters: List[str]
    comparison_stats: Dict[str, Dict[str, Dict[str, Any]]]
    group_col: str
    title: str
    xlabel: str
    ylabel: str

def clean_float(val: Any) -> Optional[float]:
    if pd.isnull(val) or (isinstance(val, (float, np.floating)) and (np.isnan(val) or np.isinf(val))):
        return None
    return float(val)

def clean_int(val: Any) -> Optional[int]:
    if pd.isnull(val) or (isinstance(val, (float, np.floating)) and np.isnan(val)):
        return None
    return int(val)

def analyze_dataframe(df: pd.DataFrame, file_name: str, source: str = "csv_upload") -> Dict[str, Any]:
    try:
        if df.empty:
            raise ValueError("The dataset is empty. Please upload a file containing data rows.")

        rows, columns = df.shape
        column_names = [str(col) for col in df.columns.tolist()]
        
        numeric_columns = []
        categorical_columns = []
        for col in df.columns:
            col_str = str(col)
            if pd.api.types.is_numeric_dtype(df[col]):
                numeric_columns.append(col_str)
            else:
                categorical_columns.append(col_str)

        group_col = None
        for col in categorical_columns:
            unique_count = df[col].nunique()
            if 2 <= unique_count <= 5:
                group_col = col
                break
        
        if not group_col and categorical_columns:
            for col in categorical_columns:
                if df[col].nunique() >= 2:
                    group_col = col
                    break
        
        if group_col:
            groups = [str(g) for g in df[group_col].dropna().unique().tolist()]
        else:
            group_col = "Group"
            groups = ["All Data"]

        def round_precision(val: Any) -> Optional[float]:
            if pd.isnull(val) or (isinstance(val, (float, np.floating)) and (np.isnan(val) or np.isinf(val))):
                return None
            return float(round(val, 4))

        comparison_stats = {}
        
        if groups != ["All Data"] and group_col:
            for g in groups:
                comparison_stats[g] = {}
                g_df = df[df[group_col] == g]
                for col in numeric_columns:
                    col_data = g_df[col].dropna()  # type: ignore
                    n = len(col_data)
                    mean = round_precision(col_data.mean())
                    std = round_precision(col_data.std())
                    sem = round_precision(col_data.sem()) if n > 1 else 0.0
                    
                    comparison_stats[g][col] = {
                        "n": n,
                        "mean": mean,
                        "std": std,
                        "sem": sem
                    }
        else:
            comparison_stats["All Data"] = {}
            for col in numeric_columns:
                col_data = df[col].dropna()
                n = len(col_data)
                mean = round_precision(col_data.mean())
                std = round_precision(col_data.std())
                sem = round_precision(col_data.sem()) if n > 1 else 0.0
                
                comparison_stats["All Data"][col] = {
                    "n": n,
                    "mean": mean,
                    "std": std,
                    "sem": sem
                }

        graph_base64 = None
        if len(numeric_columns) > 0:
            try:
                fig, ax = plt.subplots(figsize=(10, 6))
                
                parameters = numeric_columns[:10]
                x = np.arange(len(parameters))
                width = 0.8 / len(groups)
                
                for idx, g in enumerate(groups):
                    means = []
                    sems = []
                    for param in parameters:
                        p_stats = comparison_stats[g].get(param, {"mean": 0.0, "sem": 0.0})
                        means.append(p_stats.get("mean") or 0.0)
                        sems.append(p_stats.get("sem") or 0.0)
                    
                    ax.bar(
                        x + (idx - len(groups)/2 + 0.5) * width, 
                        means, 
                        width, 
                        yerr=sems, 
                        label=g, 
                        capsize=4,
                        alpha=0.85
                    )
                
                ax.set_title(f"Comparison across Parameters (by {group_col})", fontsize=14, fontweight='bold', pad=15)
                ax.set_xticks(x)
                ax.set_xticklabels(parameters, rotation=15, ha='right', fontsize=10)
                ax.set_ylabel("Value", fontsize=11)
                ax.legend(frameon=True, facecolor='white', edgecolor='none', shadow=True)
                
                for spine in ['top', 'right']:
                    ax.spines[spine].set_visible(False)
                
                plt.tight_layout()
                
                buf = io.BytesIO()
                fig.savefig(buf, format='png', bbox_inches='tight', dpi=120)
                buf.seek(0)
                img_str = base64.b64encode(buf.read()).decode('utf-8')
                plt.close(fig)
                graph_base64 = f"data:image/png;base64,{img_str}"
            except Exception as chart_err:
                print(f"[Backend] Error generating comparison bar chart: {chart_err}")

        return {
            "success": True,
            "file_name": file_name,
            "source": source,
            "rows": rows,
            "columns": columns,
            "group_col": group_col,
            "groups": groups,
            "parameters": numeric_columns,
            "comparison_stats": comparison_stats,
            "comparison_graph": graph_base64
        }
    except Exception as e:
        print(f"[Backend] Processing error: {e}")
        raise ValueError(str(e))

@router.post("/analyze-csv")
async def analyze_csv(file: UploadFile = File(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    if not file.filename or not file.filename.lower().endswith('.csv'):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload a valid CSV file (.csv)."
        )
    
    try:
        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=400, 
                detail="The uploaded file is empty. Please upload a file with data."
            )
            
        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception as parse_error:
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to parse CSV file: {str(parse_error)}"
            )

        result = analyze_dataframe(df, file_name=file.filename or "unknown.csv", source="csv_upload")
        return result

    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"[Backend] Server error in /analyze-csv: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"An error occurred while analyzing the CSV: {str(e)}"
        )

@router.post("/analyze-manual-data")
def analyze_manual_data(data: ManualDataRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    if not data.column_names or not data.rows:
        raise HTTPException(
            status_code=400,
            detail="Columns and rows must not be empty."
        )

    try:
        try:
            df = pd.DataFrame(data.rows, columns=data.column_names)
        except Exception as df_error:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to structure data: {str(df_error)}"
            )

        result = analyze_dataframe(df, file_name="Manual Entry Data", source="manual_entry")
        return result

    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"[Backend] Server error in /analyze-manual-data: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"An error occurred while analyzing the data: {str(e)}"
        )

@router.post("/regenerate-chart")
def regenerate_chart(data: ChartRegenRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        fig, ax = plt.subplots(figsize=(10, 6))
        groups = data.groups
        parameters = data.parameters[:10]
        x = np.arange(len(parameters))
        width = 0.8 / len(groups)
        
        for idx, g in enumerate(groups):
            means = []
            sems = []
            for param in parameters:
                p_stats = data.comparison_stats.get(g, {}).get(param, {"mean": 0.0, "sem": 0.0})
                means.append(p_stats.get("mean") or 0.0)
                sems.append(p_stats.get("sem") or 0.0)
            
            ax.bar(
                x + (idx - len(groups)/2 + 0.5) * width, 
                means, 
                width, 
                yerr=sems, 
                label=g, 
                capsize=4,
                alpha=0.85
            )
        
        ax.set_title(data.title, fontsize=14, fontweight='bold', pad=15)
        ax.set_xticks(x)
        ax.set_xticklabels(parameters, rotation=15, ha='right', fontsize=10)
        ax.set_xlabel(data.xlabel, fontsize=11)
        ax.set_ylabel(data.ylabel, fontsize=11)
        
        if groups != ["All Data"]:
            ax.legend(frameon=True, facecolor='white', edgecolor='none', shadow=True)
        
        for spine in ['top', 'right']:
            ax.spines[spine].set_visible(False)
            
        plt.tight_layout()
        
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=120)
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        
        return {
            "success": True,
            "comparison_graph": f"data:image/png;base64,{img_str}"
        }
    except Exception as e:
        print(f"[Backend] Error regenerating chart: {e}")
        raise HTTPException(status_code=400, detail=str(e))
