import os
import json
import urllib.request
import urllib.error
import random
import time
from datetime import datetime, timezone, timedelta

API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:8080/api/v1')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
START_DATE = datetime(2026, 3, 31, tzinfo=timezone.utc) # 봇 증가의 기준 날짜 (UTC 기준)

def do_request(method, path, data=None, token=None):
    url = f"{API_BASE_URL}{path}"
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    if token:
        headers['Authorization'] = f"Bearer {token}"
        
    req_data = None
    if data:
        req_data = json.dumps(data).encode('utf-8')
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            resp_body = response.read().decode('utf-8')
            if resp_body:
                try:
                    return json.loads(resp_body)
                except:
                    return resp_body
            return None
    except urllib.error.HTTPError as e:
        # Ignore 400 Bad Request if it's "Already exists email"
        error_body = e.read().decode('utf-8')
        if method == "POST" and "signup" in path and e.code == 400:
            return None
        print(f"HTTPError {e.code} on {path}: {error_body}")
        raise e
    except Exception as e:
        print(f"Request Error on {path}: {str(e)}")
        raise e

def get_openai_review(idx):
    # 80% 긍정, 20% 부정
    is_positive = random.random() < 0.8
    
    prompt = "공중화장실 리뷰를 1문장으로 짧게 적어줘. "
    if is_positive:
        prompt += "매우 깨끗하고 관리가 잘 되었다는 긍정적인 내용이어야 해. 이모지도 쓸 수 있으면 1개만 써."
    else:
        prompt += "휴지가 없거나 냄새가 나고 관리가 안 되었다는 비판적인 내용이어야 해. 너무 심한 욕설은 쓰지 마."
        
    if not OPENAI_API_KEY:
        # Fallback if no key is provided
        pos_reviews = ["생각보다 너무 깔끔했어요!", "향기도 나고 관리 짱👍", "휴지 넉넉해서 좋았습니다.", "급할 때 구세주였어요!"]
        neg_reviews = ["너무 냄새나서 코 막고 썼습니다 ㅠ", "휴지통이 꽉 차서 넘쳐요...", "물비누가 안 나와요.", "청소가 시급합니다."]
        return random.choice(pos_reviews if is_positive else neg_reviews)
        
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    data = json.dumps({
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.8,
        "max_tokens": 50
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = response.read().decode('utf-8')
            result = json.loads(body)
            return result['choices'][0]['message']['content'].strip()
    except Exception as e:
        print("OpenAI Error:", str(e))
        return "괜찮았어요."

def lambda_handler(event, context):
    print("AI Simulation Bot Started")
    now_utc = datetime.now(timezone.utc)
    delta_days = (now_utc - START_DATE).days
    
    # 총 봇 수 계산 (초기 30개 + 1일당 1개씩 추가 생성)
    # delta_days가 음수면 초기 상태
    growth = max(0, delta_days)
    total_bots = 30 + growth
    
    # 한 사이클에 과부하를 막기 위해 전체 봇 중 일정 비율(또는 최대 n개)만 한 번에 실행
    # 예를 들어 한 번 스케줄 당 최대 10~15개 무작위 선별
    active_bot_count = min(total_bots, random.randint(10, 20))
    selected_indices = random.sample(range(1, total_bots + 1), active_bot_count)
    
    print(f"Total available bots: {total_bots}, Executing {active_bot_count} bots for this cycle.")
    
    for bot_idx in selected_indices:
        email = f"bot_{bot_idx}@daypoo.com"
        password = "bot_password_123!"
        nickname = f"익명배변인_{bot_idx}"
        
        # 1. SignUp (Ignored if already exists)
        try:
            do_request("POST", "/auth/signup", {
                "email": email,
                "password": password,
                "nickname": nickname
            })
        except Exception:
            pass
            
        # 2. Login
        token = None
        try:
            res = do_request("POST", "/auth/login", {"email": email, "password": password})
            if res and 'accessToken' in res:
                token = res['accessToken']
            elif res and 'data' in res and 'accessToken' in res['data']:
                token = res['data']['accessToken']
        except Exception as e:
            print(f"Bot {bot_idx} login failed. Skipping.")
            continue
            
        if not token:
            continue
            
        # 3. Fetch toilets near Gangnam (latitude: 37.4979, longitude: 127.0276)
        # We need a toiletId to create a Poo Record
        toilet_id = None
        toilet_lat = 37.4979
        toilet_lng = 127.0276
        
        try:
            lat = 37.4979 + (random.uniform(-0.02, 0.02))
            lng = 127.0276 + (random.uniform(-0.02, 0.02))
            toilets = do_request("GET", f"/toilets?latitude={lat}&longitude={lng}&radius=5000", token=token)
            
            toilet_list = []
            if isinstance(toilets, list):
                toilet_list = toilets
            elif toilets and 'data' in toilets and isinstance(toilets['data'], list):
                toilet_list = toilets['data']
            elif toilets and 'content' in toilets:
                toilet_list = toilets['content']
                
            if toilet_list:
                t = random.choice(toilet_list)
                toilet_id = t.get('id')
                toilet_lat = t.get('latitude', lat)
                toilet_lng = t.get('longitude', lng)
        except Exception as e:
            print(f"Bot {bot_idx} toilet fetch failed. Skipping activity.", e)
            continue

        if not toilet_id:
            print(f"Bot {bot_idx} no toilets found nearby. Skipping activity.")
            continue

        # 4. Create Poo Record (70% Normal, 30% Abnormal)
        is_normal = random.random() < 0.7
        bristol_scale = random.randint(3, 4) if is_normal else random.choice([1, 2, 5, 6, 7])
        color = random.choice(["BROWN", "GOLD", "DARK_BROWN", "GREEN"]) if is_normal else random.choice(["RED", "BLACK", "PALE", "YELLOW"])
        condition_tags = ["GOOD", "NORMAL"] if is_normal else ["TIRED", "STRESS"]
        diet_tags = ["VEGETABLE", "FRUIT"] if is_normal else ["INSTANT", "MEAT"]
        
        try:
            do_request("POST", "/records", {
                "toiletId": toilet_id,
                "bristolScale": bristol_scale,
                "color": color,
                "conditionTags": condition_tags,
                "dietTags": diet_tags,
                "latitude": toilet_lat,
                "longitude": toilet_lng
            }, token)
        except Exception as e:
            print(f"Bot {bot_idx} poo record failed.", e)
            
        # 5. Toilet Review (100% chance for selected bots if pool is valid)
        try:
            review_text = get_openai_review(bot_idx)
            tags = ["CLEAN", "TISSUE"] if "깨끗" in review_text or "좋" in review_text else ["DIRTY", "SMELL"]
            do_request("POST", f"/toilets/{toilet_id}/reviews", {
                "rating": random.randint(1, 5),
                "emojiTags": tags,
                "comment": review_text
            }, token)
        except Exception as e:
            print(f"Bot {bot_idx} toilet review failed.", e)
            
        # 6. CS Inquiry (1-2% ultra low chance)
        if random.random() < 0.015:
            try:
                do_request("POST", "/support/inquiries", {
                    "type": "OTHERS",
                    "title": "제가 사용하는 지역 화장실도 추가해주세요",
                    "content": f"안녕하세요 {nickname} 봇입니다. (AI 자동 생성 시스템 점검 문의)"
                }, token)
                print(f"Bot {bot_idx} created an inquiry!")
            except Exception:
                pass
                
        # Brief sleep between iterations to prevent instantaneous self-DDOS
        time.sleep(0.5)

    print("AI Simulation Bot Finished Execute")
    return {"statusCode": 200, "body": "Simulation Bot executed successfully."}

if __name__ == "__main__":
    lambda_handler(None, None)
