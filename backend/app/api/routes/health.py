from fastapi import APIRouter, HTTPException

from app.database.database import check_database_connection

router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get(
    "/database",
    summary="Verificar conexao com o banco",
    description="Executa uma consulta simples para validar a conexao ativa com o PostgreSQL.",
)
def database_healthcheck():
    try:
        return check_database_connection()
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao conectar no banco de dados: {error}",
        )
