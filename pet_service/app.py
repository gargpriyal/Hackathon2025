from fastapi import FastAPI
from routers import flashcards, items, users, inventory, pets
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS for your frontend
origins = [
    "http://localhost:5173",  # React dev server
    "http://127.0.0.1:3000",
    # add other origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

@app.get("/health")
def check_health():
    return {"status": "ok"}


# include routers
app.include_router(flashcards.router)
app.include_router(items.router)
app.include_router(users.router)
app.include_router(inventory.router)
app.include_router(pets.router)



