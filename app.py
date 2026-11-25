from flask import Flask , request, jsonify
from flask_cors import CORS
import os
import psycopg2

app = Flask(__name__)
CORS(app)

def get_connection():
    return psycopg2.connect(
        dbname="clinic_db",
        user="clinic_user",
        password=os.environ["DB_PASSWORD"],
        host="localhost",
    )

@app.errorhandler(psycopg2.Error)
def handle_db_error(e):
    app.logger.error(e)
    return jsonify({"error": "Database unavailable"}), 503


@app.route('/clinics')
def list_clinics():
    rows = run_query("SELECT id, name, facility_type, ST_Y(geom), ST_X(geom) "
        "FROM clinics ORDER BY id;"
)

    return jsonify([clinic_to_dict(row) for row in rows ])




@app.route('/')
def home():
    return "Clinic Locator API is running!"

@app.route('/nearest')
def nearest_clinic():
    try:
        lat , lon = read_point()
        count = int(request.args.get('count', 3))
 
    except (TypeError, ValueError) as e:
        return jsonify({"error": str(e)}), 400


    

    if not 1 <= count <= 150:
        return jsonify({"error": "Invalid count value. Must be between 1 and 150."}), 400


    sql = """
        SELECT id, name, facility_type,
               ST_Y(geom) AS lat, ST_X(geom) AS lon,
               ST_Distance(
                   geom::geography,
                   ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
               ) AS distance_m
        FROM clinics
        ORDER BY distance_m
        LIMIT %s;
    """
    
    row = run_query(sql, (lon, lat, count))


    return jsonify([clinic_to_dict(row) for row in row])




@app.route('/within')
def clinics_within():
    try:
        lat, lon = read_point()
        radius = float(request.args.get('radius', 5000))
    except (TypeError, ValueError)as e :
        return jsonify({"error": str(e)}), 400

    
    if not (0 < radius <= 100000):
        return jsonify({"error": "radius must be greater than 0 and at most 100000 meters"}), 400

    sql = """
        SELECT id, name, facility_type,
               ST_Y(geom) AS lat, ST_X(geom) AS lon,
               ST_Distance(
                   geom::geography,
                   ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
               ) AS distance_m
        FROM clinics
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
            %s
        )
        ORDER BY distance_m;
    """
    row = run_query(sql, (lon, lat, lon, lat, radius))  

    return jsonify([clinic_to_dict(row) for row in row])




def read_point():
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lon are required and must be numbers"}), 400

    if not -90 <= lat <= 90:
        return jsonify({"error": "Invalid latitude value. Must be between -90 and 90."}), 400

    if not -180 <= lon <= 180:
        return jsonify({"error": "Invalid longitude value. Must be between -180 and 180."}), 400

    return lat, lon



def run_query(sql, params=()):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        return cur.fetchall()
    finally:
        conn.close()


def clinic_to_dict(row):
    clinic = {
        "id": row[0],
        "name": row[1],
        "type": row[2],
        "lat": row[3],
        "lon": row[4],
    }
    if len(row) > 5:
        clinic["distance_m"] = round(float(row[5]), 1)
    return clinic

if __name__ == '__main__':
    app.run(debug=True)