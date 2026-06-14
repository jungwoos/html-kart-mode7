# 🏎️ HTML 카트 — Mode 7

순수 HTML/JS 단일 파일로 만든 유사 3D(Mode 7) 카트 레이싱 게임.
외부 라이브러리 없이 `index.html` 하나로 동작합니다.

## 조작 방식 (3종)

| 모드 | 조향 | 가속 / 브레이크 |
|------|------|----------------|
| 🎮 게임패드 | 왼쪽 스틱 | RT/A · LT/B |
| 📱 기울기(핸들) | 폰을 좌우로 기울이기 | 화면 버튼 |
| 👆 터치 | 화면 ◀▶ 버튼 | 화면 버튼 |

- **게임패드**: 블루투스로 폰/PC에 페어링하면 자동 인식 (Gamepad API)
- **기울기**: 출발 시 잡은 각도를 0점으로 자동 보정 → 핸들처럼 좌우로 기울여 커브 (DeviceOrientation API)
- **터치 / 키보드(↑↓←→, WASD)** 도 지원

## 실행

### 1) 그냥 플레이 (게임패드 · 터치)
`index.html`을 브라우저로 열면 됩니다.

### 2) 기울기 센서까지 쓰려면 — HTTPS 또는 localhost 필요
기기 방향 센서는 **보안 컨텍스트(secure context)** 에서만 동작합니다.
`file://` 로 열면 게임패드·터치는 되지만 기울기는 막힙니다.

가장 쉬운 방법(안드로이드 USB 연결):

```bash
python3 -m http.server 8000        # PC에서 서버 실행
adb reverse tcp:8000 tcp:8000      # 폰의 localhost를 PC로 포워딩
```

→ 폰 Chrome에서 `http://localhost:8000` 접속 (localhost 라서 센서 동작)

### 3) GitHub Pages 로 호스팅
Settings → Pages → Branch `main` / `/root` 선택하면
`https://<사용자명>.github.io/html-kart-mode7/` 에서 HTTPS로 바로 플레이 (기울기 센서 포함).

## 기술

- Mode 7 스타일 per-scanline 원근 투영 (저해상도 내부 버퍼 → 확대)
- 절차적 생성 트랙(탑다운 비트맵 샘플링 + 노면 판정)
- 랩 카운트 / 속도계 / 랩 타임 HUD
