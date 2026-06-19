# Test Data Generator for 200+ test cases
def generate_test_data(category, count):
    return [
        {
            "id": f"TC_{category.upper()}_{str(i).zfill(3)}",
            "module": category,
            "priority": "High" if i % 5 == 0 else "Medium",
            "name": f"Verify {category} functionality part {i}"
        }
        for i in range(1, count + 1)
    ]

# The required counts
test_cases = {
    "auth": 20,
    "authz": 20,
    "nav": 20,
    "ui": 20,
    "forms": 12,
    "crud": 30,
    "input": 12,
    "error": 20,
    "session": 20,
    "upload": 12,
    "a11y": 12,
    "responsive": 12,
    "perf": 12,
    "regression": 12
}

def get_all_test_data():
    all_data = {}
    for category, count in test_cases.items():
        all_data[category] = generate_test_data(category, count)
    return all_data

TEST_DATA = get_all_test_data()
