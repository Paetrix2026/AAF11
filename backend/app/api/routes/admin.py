from fastapi import APIRouter

router = APIRouter()

@router.get('/')
async def get_admin():
    return {'message': 'Hello from admin route'}

