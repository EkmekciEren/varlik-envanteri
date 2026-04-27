import urllib.request
import json
import urllib.error

url_login = 'http://127.0.0.1:8000/api/auth/login'
data = json.dumps({'username': 'admin', 'password': 'Admin123!'}).encode('utf-8')
req_login = urllib.request.Request(url_login, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req_login) as response:
        token = json.loads(response.read().decode('utf-8'))['access_token']

    url_types = 'http://127.0.0.1:8000/api/asset-types'
    req_types = urllib.request.Request(url_types, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req_types) as response:
        types_res = json.loads(response.read().decode('utf-8'))
        print(f"Total Asset Types: {len(types_res)}")
        if len(types_res) > 0:
            print("First Asset Type:")
            print(json.dumps(types_res[0], indent=2))

except Exception as e:
    print(f"Error: {e}")
