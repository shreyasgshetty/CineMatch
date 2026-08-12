import os, sys, re
sys.path.insert(0, '.')
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path('../server/.env'))
import pymongo

client = pymongo.MongoClient(os.environ['MONGODB_URI'])
uri = os.environ['MONGODB_URI']
# Extract DB name: last path component before query string
from urllib.parse import urlparse
parsed = urlparse(uri)
db_name = parsed.path.lstrip('/').split('?')[0] or 'cinematch'
print("DB name:", db_name)
db = client[db_name]

docs = list(db['media'].find(
    {"featureText": {"$exists": True, "$ne": ""}},
    {"featureText": 1}
).limit(5))

for d in docs:
    ft = d.get("featureText", "")
    tokens_unicode = re.findall(r'(?u)\b\w\w+\b', ft)
    tokens_ascii   = re.findall(r'(?u)\b[a-zA-Z][a-zA-Z0-9\-]{1,}\b', ft)
    print("featureText sample:", repr(ft[:150]))
    print("Unicode tokens:", len(tokens_unicode), "| sample:", tokens_unicode[:6])
    print("ASCII tokens:  ", len(tokens_ascii),   "| sample:", tokens_ascii[:6])
    print()

print("Total media docs:", db['media'].count_documents({}))
print("With featureText:", db['media'].count_documents({"featureText": {"$exists": True, "$ne": ""}}))
