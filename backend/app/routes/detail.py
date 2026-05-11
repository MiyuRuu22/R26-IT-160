from fastapi import APIRouter, HTTPException
from app.services.search_service import get_connection

router = APIRouter()


@router.get("/detail/{item_id}")
def get_detail(item_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            id,
            content_type,
            category,
            title,
            content,
            short_text,
            act_name,
            act_no,
            section_number
        FROM legal_content
        WHERE id = %s
        """,
        (item_id,)
    )

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Item not found")

    return {
        "id": row[0],
        "type": row[1],
        "category": row[2],
        "title": row[3],
        "content": row[4],
        "short_text": row[5],
        "act_name": row[6],
        "act_no": row[7],
        "section_number": row[8],
    }