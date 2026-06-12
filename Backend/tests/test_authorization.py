import requests

def test_history_unauthorized():
    response = requests.get('http://localhost:8000/paraphrase/history')
    assert response.status_code == 401, 'Expected 401 Unauthorized'

if __name__ == '__main__':
    test_history_unauthorized()
    print('Auth test passed!')
