from fastapi import FastAPI
from routers import flashcards, items, users, inventory, pets

app = FastAPI()


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



