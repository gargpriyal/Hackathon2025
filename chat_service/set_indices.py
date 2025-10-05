from pymongo.mongo_client import MongoClient
from pymongo.operations import SearchIndexModel
from pymongo import ASCENDING, DESCENDING
import time
from dotenv import load_dotenv
import os

load_dotenv()

# Connect to your Atlas deployment
uri = os.getenv("MONGODB_URI")
client = MongoClient(uri)

# Access your database
database = client["aivy_db"]

print("="*60)
print("Setting up MongoDB indexes and vector search...")
print("="*60)

# ========================================
# 1. CREATE REGULAR DATABASE INDEXES
# ========================================

def create_index_safely(collection, index_spec, **kwargs):
    """Create an index, handling the case where it already exists"""
    try:
        result = collection.create_index(index_spec, **kwargs)
        print(f"✓ Created index '{result}' on {collection.name}")
        return result
    except Exception as e:
        if "already exists" in str(e) or "IndexOptionsConflict" in str(e):
            index_name = kwargs.get('name', str(index_spec))
            print(f"  Index '{index_name}' on {collection.name} already exists, skipping...")
        else:
            print(f"✗ Error creating index on {collection.name}: {e}")

print("\n1. Creating regular database indexes...")
print("-" * 60)

# Users collection
users_collection = database["users"]
create_index_safely(
    users_collection,
    [("email", ASCENDING)],
    unique=True,
    name="email_unique_idx"
)

# Projects collection
projects_collection = database["projects"]
create_index_safely(
    projects_collection,
    [("user_id", ASCENDING)],
    name="user_id_idx"
)
create_index_safely(
    projects_collection,
    [("user_id", ASCENDING), ("project_name", ASCENDING)],
    name="user_project_name_idx"
)

# Chats collection
chats_collection = database["chats"]
create_index_safely(
    chats_collection,
    [("user_id", ASCENDING), ("project_id", ASCENDING)],
    name="user_project_idx"
)
create_index_safely(
    chats_collection,
    [("project_id", ASCENDING)],
    name="project_id_idx"
)
create_index_safely(
    chats_collection,
    [("last_updated", DESCENDING)],
    name="last_updated_idx"
)

# Topics collection
topics_collection = database["topics"]
create_index_safely(
    topics_collection,
    [("user_id", ASCENDING), ("name", ASCENDING)],
    unique=True,
    name="user_topic_unique_idx"
)

# Documents collection (regular indexes, not vector)
documents_collection = database["documents"]
create_index_safely(
    documents_collection,
    [("user_id", ASCENDING)],
    name="user_id_idx"
)
create_index_safely(
    documents_collection,
    [("project_id", ASCENDING)],
    name="project_id_idx"
)
create_index_safely(
    documents_collection,
    [("user_id", ASCENDING), ("project_id", ASCENDING), ("chat_id", ASCENDING)],
    name="user_project_chat_idx"
)

# Checkpoints collection (for LangGraph)
checkpoints_collection = database["checkpoints"]
create_index_safely(
    checkpoints_collection,
    [("thread_id", ASCENDING), ("checkpoint_id", DESCENDING)],
    name="thread_checkpoint_idx"
)
create_index_safely(
    checkpoints_collection,
    [("metadata.user_id", ASCENDING)],
    name="metadata_user_id_idx",
    sparse=True  # Sparse because metadata might not always exist
)
create_index_safely(
    checkpoints_collection,
    [("metadata.project_id", ASCENDING)],
    name="metadata_project_id_idx",
    sparse=True
)

print("\n✓ Regular database indexes created successfully!")

# ========================================
# 2. CREATE VECTOR SEARCH INDEX
# ========================================

print("\n2. Creating vector search index...")
print("-" * 60)

# Check if vector index already exists
existing_indexes = list(documents_collection.list_search_indexes())
vector_index_exists = any(idx.get("name") == "vector_index" for idx in existing_indexes)

if vector_index_exists:
    print("  Vector search index 'vector_index' already exists, skipping creation...")
else:
    # Create your index model, then create the search index
    search_index_model = SearchIndexModel(
        definition={
            "fields": [
                {
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": 1024,
                    "similarity": "dotProduct",  # or "cosine" depending on your needs
                    "quantization": "scalar"
                }
            ]
        },
        name="vector_index",
        type="vectorSearch"
    )

    result = documents_collection.create_search_index(model=search_index_model)
    print(f"✓ New vector search index '{result}' is building...")

    # Wait for initial sync to complete
    print("  Polling to check if the index is ready. This may take up to a minute.")
    
    predicate = lambda index: index.get("queryable") is True

    while True:
        indices = list(documents_collection.list_search_indexes(result))
        if len(indices) and predicate(indices[0]):
            break
        time.sleep(5)
        print("  Still building...", end="\r")
    
    print(f"\n✓ Vector search index '{result}' is ready for querying!")

# ========================================
# 3. SUMMARY
# ========================================

print("\n" + "="*60)
print("Index Setup Summary")
print("="*60)

# Count indexes per collection
collections_to_check = [
    ("users", users_collection),
    ("projects", projects_collection),
    ("chats", chats_collection),
    ("topics", topics_collection),
    ("documents", documents_collection),
    ("checkpoints", checkpoints_collection)
]

for name, coll in collections_to_check:
    regular_indexes = list(coll.list_indexes())
    print(f"  {name}: {len(regular_indexes)} regular indexes")

# Vector search indexes
vector_indexes = list(documents_collection.list_search_indexes())
print(f"  documents: {len(vector_indexes)} vector search indexes")

print("\n✓ All indexes are set up and ready!")
print("="*60)

client.close()