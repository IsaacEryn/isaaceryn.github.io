# 대학 홈페이지 HTTPS·인증서 조사

블로그 글 「크롬 HTTP 경고와 인증서 200일 시대, 대학 홈페이지 201곳 실측」(codeslog, 초안)의 조사 스크립트입니다.
원자료(학교 목록과 호스트별 결과)는 학교 이름이 들어 있어 올리지 않습니다(`raw/`는 git에서 제외). 공개하는 건 집계(`results/summary.json`)뿐입니다.

## 무엇을 하나

호스트마다 연결을 두 번만 엽니다.

1. `http://호스트/`에 GET 한 번. 응답 머리글만 읽고 끊습니다. 리다이렉트는 따라가지 않습니다
2. `호스트:443`에 TLS 연결 한 번. 인증서를 받고, 같은 연결로 `GET /`를 보내 머리글(HSTS)만 읽습니다

호스트 사이에 3초를 쉬고, User-Agent에 조사 목적과 블로그 주소를 밝힙니다. 체인 검증은 받은 인증서로 내 컴퓨터에서(`openssl verify`, certifi 루트) 합니다.

## 파일

- `make_list.py`: 대학알리미 자료실 「학교 개황 정보」 엑셀(xls를 xlsx로 바꾼 것)에서 4년제 대학 호스트 목록을 뽑습니다
- `scan.py`: 위 두 연결을 하고 호스트마다 한 줄씩 jsonl로 남깁니다. 끊기면 이어서 잽니다
- `summarize.py`: 학교 이름 없이 집계합니다
- `chrome-tls-check.mjs`: 파이썬에서 TLS 핸드셰이크가 거부된 호스트만 크롬으로 `https://` 이동 한 번씩 확인합니다(결과 코드만 셉니다). 2026-10-24에는 7곳 모두 크롬 155에서 정상으로 열렸습니다
- `chrome-warning.mjs`: 크롬으로 http:// 주소를 열어 경고 화면이 뜨는지 보는 실험(자동화로 띄운 크롬에서는 경고 화면이 그려지지 않아 글에서는 화면 캡처로 확인)

## 내 도메인만 재기

```bash
printf 'host\nwww.example.ac.kr\n' > mine.csv
python3 -I scan.py mine.csv mine.jsonl
python3 -I summarize.py mine.jsonl mine-summary.json
```

남의 사이트를 여러 곳 잴 때는 간격을 두고 요청 수를 늘리지 마세요.
