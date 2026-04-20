from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from database import get_connection
from utils.transform import db_row_to_provider, db_row_to_review

router = APIRouter()


def build_provider_query(
    q: Optional[str] = None,
    condition: Optional[str] = None,
    telehealth_only: bool = False,
    accepting_only: bool = False,
    insurance: Optional[str] = None,
    language: Optional[str] = None,
    specialty: Optional[str] = None,
    min_rating: float = 0.0,
    min_years_experience: int = 0,
    sort: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    conditions = []
    params = []

    if q:
        conditions.append("(name LIKE ? OR overview LIKE ? OR specialty LIKE ? OR locations LIKE ?)")
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"])
    if condition:
        conditions.append("conditions_treated LIKE ?")
        params.append(f"%{condition}%")
    if specialty:
        conditions.append("(specialty = ? OR specialties LIKE ?)")
        params.extend([specialty, f"%{specialty}%"])
    if telehealth_only:
        conditions.append("virtual_visit = 1")
    if accepting_only:
        conditions.append("accepting_new_patients = 1")
    if insurance:
        conditions.append("insurance LIKE ?")
        params.append(f"%{insurance}%")
    if language:
        conditions.append("languages LIKE ?")
        params.append(f"%{language}%")
    if min_rating > 0:
        conditions.append("rating >= ?")
        params.append(min_rating)
    if min_years_experience > 0:
        conditions.append("experience_years >= ?")
        params.append(min_years_experience)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    order_map = {
        "rating": "rating DESC",
        "reviews": "review_count DESC",
        "experience": "experience_years DESC",
        "recent": "created_at DESC",
    }
    order = order_map.get(sort, "rating DESC")

    count_sql = f"SELECT COUNT(*) FROM providers {where}"
    data_sql = (
        f"SELECT p.*, pi.profile_summary, pi.pros, pi.cons, pi.sentiment_score "
        f"FROM providers p LEFT JOIN provider_insights pi ON p.id = pi.provider_id "
        f"{where} ORDER BY {order} LIMIT ? OFFSET ?"
    )

    return count_sql, data_sql, params, limit, offset


@router.get("/providers/top-rated")
def top_rated(limit: int = Query(10, ge=1, le=100)):
    return list_providers(limit=limit, sort="rating")


@router.get("/providers/most-reviewed")
def most_reviewed(limit: int = Query(10, ge=1, le=100)):
    return list_providers(limit=limit, sort="reviews")


@router.get("/providers/recently-added")
def recently_added(limit: int = Query(10, ge=1, le=100)):
    return list_providers(limit=limit, sort="recent")


@router.get("/providers/accepting-new")
def accepting_new(limit: int = Query(20, ge=1, le=100)):
    return list_providers(limit=limit, accepting_only=True, sort="rating")


@router.get("/providers/telehealth")
def telehealth(limit: int = Query(20, ge=1, le=100)):
    return list_providers(limit=limit, telehealth_only=True, sort="rating")


@router.get("/providers/nearby")
def nearby(
    lat: float = Query(...),
    lng: float = Query(...),
    limit: int = Query(10, ge=1, le=100),
    radius: float = Query(50.0, ge=0.5, le=100.0),
):
    from math import radians, sin, cos, sqrt, atan2

    def haversine(lat1, lon1, lat2, lon2) -> float:
        R = 3958.8
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        return R * 2 * atan2(sqrt(a), sqrt(1 - a))

    # Illinois zip code centroids (lat, lng)
    IL_ZIP_COORDS = {
        "60601": (41.8858, -87.6181), "60602": (41.8827, -87.6290), "60603": (41.8796, -87.6294),
        "60604": (41.8765, -87.6294), "60605": (41.8672, -87.6229), "60606": (41.8827, -87.6377),
        "60607": (41.8726, -87.6554), "60608": (41.8479, -87.6640), "60609": (41.8145, -87.6499),
        "60610": (41.9003, -87.6341), "60611": (41.8969, -87.6231), "60612": (41.8797, -87.6818),
        "60613": (41.9533, -87.6587), "60614": (41.9236, -87.6487), "60615": (41.8008, -87.5947),
        "60616": (41.8413, -87.6229), "60617": (41.7230, -87.5520), "60618": (41.9451, -87.7006),
        "60619": (41.7477, -87.6008), "60620": (41.7425, -87.6501), "60621": (41.7755, -87.6453),
        "60622": (41.9006, -87.6779), "60623": (41.8479, -87.7181), "60624": (41.8797, -87.7181),
        "60625": (41.9726, -87.7034), "60626": (42.0050, -87.6652), "60628": (41.6936, -87.6230),
        "60629": (41.7766, -87.7103), "60630": (41.9726, -87.7577), "60631": (41.9958, -87.8089),
        "60632": (41.8145, -87.7181), "60633": (41.6600, -87.5350), "60634": (41.9452, -87.8006),
        "60636": (41.7766, -87.6768), "60637": (41.7808, -87.5947), "60638": (41.7862, -87.7759),
        "60639": (41.9201, -87.7759), "60640": (41.9726, -87.6534), "60641": (41.9452, -87.7577),
        "60642": (41.9058, -87.6588), "60643": (41.7007, -87.6556), "60644": (41.8797, -87.7577),
        "60645": (42.0101, -87.6877), "60646": (41.9958, -87.7577), "60647": (41.9201, -87.7034),
        "60649": (41.7614, -87.5639), "60651": (41.9003, -87.7434), "60652": (41.7477, -87.7181),
        "60653": (41.8208, -87.5947), "60654": (41.8907, -87.6354), "60655": (41.7007, -87.7103),
        "60656": (41.9773, -87.8428), "60657": (41.9402, -87.6488), "60659": (41.9906, -87.7006),
        "60660": (41.9906, -87.6534), "60661": (41.8827, -87.6457), "60706": (41.9625, -87.8428),
        "60707": (41.9201, -87.8428), "60714": (42.0050, -87.8428),
        "60076": (42.0374, -87.7034), "60077": (42.0374, -87.7577), "60091": (42.0732, -87.7034),
        "60093": (42.1089, -87.7434), "60201": (42.0374, -87.6877), "60202": (42.0374, -87.7006),
        "60203": (42.0604, -87.6877), "60301": (41.8858, -87.7888), "60302": (41.9003, -87.7888),
        "60304": (41.8672, -87.7888), "60402": (41.8479, -87.8297), "60406": (41.6883, -87.6973),
        "60411": (41.6035, -87.5494), "60415": (41.7192, -87.7759), "60419": (41.6373, -87.6175),
        "60422": (41.6659, -87.7265), "60425": (41.6094, -87.6100), "60426": (41.6430, -87.6651),
        "60428": (41.6594, -87.7036), "60429": (41.6372, -87.7313), "60430": (41.7192, -87.7313),
        "60438": (41.5876, -87.5551), "60439": (41.7307, -87.9740), "60440": (41.6720, -88.0874),
        "60441": (41.6094, -88.0284), "60445": (41.6883, -87.7759), "60452": (41.6035, -87.7759),
        "60453": (41.7192, -87.7888), "60455": (41.7862, -87.8428), "60456": (41.7477, -87.8428),
        "60457": (41.7307, -87.8428), "60458": (41.7136, -87.8688), "60459": (41.7625, -87.8994),
        "60461": (41.6035, -87.6651), "60462": (41.6094, -87.8297), "60463": (41.6883, -87.7888),
        "60464": (41.6430, -87.8428), "60465": (41.7477, -87.8994), "60466": (41.5876, -87.7036),
        "60467": (41.6094, -87.8688), "60469": (41.6430, -87.7759), "60471": (41.5647, -87.6756),
        "60472": (41.6594, -87.7577), "60473": (41.5876, -87.6100), "60475": (41.4770, -87.7265),
        "60476": (41.5647, -87.6100), "60477": (41.5876, -87.7759), "60478": (41.5418, -87.7759),
        "60480": (41.7477, -87.9456), "60482": (41.7307, -87.7888), "60487": (41.6094, -87.9170),
        "60490": (41.6430, -88.1174), "60491": (41.6094, -87.9740), "60501": (41.7862, -87.9170),
        "60504": (41.7625, -88.1174), "60505": (41.7307, -88.2874), "60506": (41.7625, -88.3464),
        "60510": (41.8572, -88.3757), "60515": (41.8145, -87.9740), "60516": (41.7625, -87.9740),
        "60517": (41.7477, -88.0284), "60521": (41.8145, -87.9456), "60523": (41.8308, -87.9740),
        "60525": (41.8145, -87.8994), "60526": (41.8308, -87.9170), "60527": (41.7862, -87.9456),
        "60532": (41.8145, -88.0284), "60534": (41.8308, -87.8688), "60540": (41.7625, -88.1174),
        "60542": (41.8308, -88.2874), "60543": (41.6720, -88.3757), "60544": (41.6094, -88.1764),
        "60546": (41.8308, -87.8428), "60555": (41.8308, -88.1764), "60558": (41.8308, -87.9170),
        "60559": (41.8145, -87.9740), "60560": (41.5189, -88.4347), "60561": (41.7477, -88.0874),
        "60563": (41.7862, -88.1474), "60564": (41.7136, -88.1474), "60565": (41.7307, -88.1174),
        "60586": (41.5647, -88.1764), "60601": (41.8858, -87.6181),
    }

    conn = get_connection()
    rows = conn.execute(
        "SELECT p.*, pi.profile_summary, pi.pros, pi.cons, pi.sentiment_score "
        "FROM providers p LEFT JOIN provider_insights pi ON p.id = pi.provider_id "
        "ORDER BY p.rating DESC"
    ).fetchall()
    conn.close()

    results = []
    for row in rows:
        row = dict(row)
        locations = []
        try:
            import json
            locations = json.loads(row.get("locations") or "[]")
        except Exception:
            pass
        for loc in locations:
            zipcode = (loc.get("zipcode") or "").strip()
            coords = IL_ZIP_COORDS.get(zipcode)
            if coords:
                dist = haversine(lat, lng, coords[0], coords[1])
                if dist <= radius:
                    results.append((dist, row))
                    break
        if len(results) >= limit * 3:
            break

    results.sort(key=lambda x: x[0])
    providers = [db_row_to_provider(r) for _, r in results[:limit]]
    return {"providers": providers, "total": len(providers), "limit": limit, "offset": 0}


@router.get("/providers/{provider_id}")
def get_provider(provider_id: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT p.*, pi.profile_summary, pi.pros, pi.cons, pi.sentiment_score "
        "FROM providers p LEFT JOIN provider_insights pi ON p.id = pi.provider_id "
        "WHERE p.id = ?",
        (provider_id,)
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Provider not found")
    review_rows = conn.execute(
        "SELECT * FROM reviews WHERE provider_id = ? ORDER BY review_date DESC",
        (provider_id,)
    ).fetchall()
    conn.close()
    reviews = [db_row_to_review(dict(r)) for r in review_rows]
    return db_row_to_provider(dict(row), reviews=reviews)


@router.get("/providers")
def list_providers(
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    q: Optional[str] = None,
    condition: Optional[str] = None,
    gender: Optional[str] = None,
    telehealth_only: bool = False,
    accepting_only: bool = False,
    insurance: Optional[str] = None,
    language: Optional[str] = None,
    specialty: Optional[str] = None,
    min_rating: float = 0.0,
    min_years_experience: int = 0,
    sort: Optional[str] = None,
):
    count_sql, data_sql, params, limit, offset = build_provider_query(
        q=q, condition=condition, telehealth_only=telehealth_only,
        accepting_only=accepting_only, insurance=insurance, language=language,
        specialty=specialty, min_rating=min_rating,
        min_years_experience=min_years_experience, sort=sort,
        limit=limit, offset=offset,
    )

    conn = get_connection()
    total = conn.execute(count_sql, params).fetchone()[0]
    rows = conn.execute(data_sql, params + [limit, offset]).fetchall()
    conn.close()

    providers = [db_row_to_provider(dict(row)) for row in rows]
    return {"providers": providers, "total": total, "limit": limit, "offset": offset}
