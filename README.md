# 🏎️ HTML 카트 — Mode 7 (+ 온라인 멀티플레이)

유사 3D(Mode 7) 카트 레이싱 게임. 게임 화면(정적)과 멀티플레이 WebSocket 서버를
**하나의 Render 서비스**로 함께 배포합니다. 같은 오리진(HTTPS)이라 기울기 센서도 동작하고,
멀티 접속 시 서버 주소를 따로 입력할 필요가 없습니다.

## 조작 방식 (3종)

| 모드 | 조향 | 가속 / 브레이크 |
|------|------|----------------|
| 🎮 게임패드 | 왼쪽 스틱 | RT/A · LT/B |
| 📱 기울기(핸들) | 폰을 좌우로 기울이기 | 화면 버튼 |
| 👆 터치 | 화면 ◀▶ 버튼 | 화면 버튼 |

- **게임패드**: 블루투스로 폰/PC에 페어링하면 자동 인식 (Gamepad API)
- **기울기**: 출발 시 잡은 각도를 0점으로 자동 보정 → 핸들처럼 좌우로 기울여 커브 (DeviceOrientation API)
- **터치 / 키보드(↑↓←→, WASD)** 도 지원

## 멀티플레이

- 시작 화면에서 **닉네임 + 방 코드**를 입력하고 `🌐 멀티로 출발`
- 같은 방 코드를 입력한 사람끼리 함께 달립니다 (방당 최대 8명)
- 각 클라이언트가 자기 카트 상태를 ~15Hz로 전송, 서버는 같은 방에 중계 (relay)
- 상대 카트는 닉네임표와 함께 Mode 7 화면에 렌더링됩니다

## 구조

```
public/index.html   게임 클라이언트 (단일 HTML, 외부 의존성 0)
server.js           정적 파일 서빙 + WebSocket 중계 (같은 포트)
package.json        ws 의존성, start: node server.js
render.yaml         Render Blueprint (원클릭 배포)
```

## 배포 (Render)

1. 이 저장소를 Render에 연결: 대시보드 → **New → Blueprint** → 저장소 선택
   (`render.yaml` 의 무료 web 서비스가 생성됨)
2. 배포 완료 후 `https://<서비스명>.onrender.com` 으로 접속하면 바로 플레이
3. HTTPS라서 안드로이드 폰 Chrome에서 **기울기 센서·게임패드·멀티** 모두 동작

> 무료 플랜은 일정 시간 미사용 시 슬립 → 첫 접속이 ~30초 걸릴 수 있습니다.

## 로컬 실행

```bash
npm install
npm start            # http://localhost:8080 (PORT 환경변수로 변경 가능)
```

→ 브라우저에서 `http://localhost:8080`. localhost는 secure context라 센서까지 테스트 가능.
안드로이드 USB 연결 시 `adb reverse tcp:8080 tcp:8080` 후 폰에서 `http://localhost:8080`.

## 기술

- Mode 7 스타일 per-scanline 원근 투영 (저해상도 내부 버퍼 → 확대)
- 절차적 생성 트랙(탑다운 비트맵 샘플링 + 노면 판정)
- 원격 카트는 렌더러와 동일한 카메라 모델로 월드→화면 투영
- 랩 카운트 / 속도계 / 랩 타임 / 접속 인원 HUD
