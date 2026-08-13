import os, pymongo
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path('../server/.env'))
db = pymongo.MongoClient(os.environ['MONGODB_URI'])['test']
doc = db['media'].find_one({}, {'_id': 1, 'title': 1})
mid = str(doc['_id'])
print(mid, '|', doc['title'])

# Test /similar
import urllib.request, json
url = f"http://localhost:8000/similar/{mid}?limit=3"
resp = urllib.request.urlopen(url)
data = json.loads(resp.read())
print(f"\n/similar/{mid}")
for s in data['similar']:
    print(f"  {s['similarity']:.3f} | {s['title']}")
