# Bunker Boats: Linux + Docker

## Requirements

- Docker 24+
- Docker Compose v2

## Environment

Create `server/.env` from `server/.env.example` and set at least:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=change_me
SQLITE_PATH=/data/database.sqlite
CORS_ORIGINS=http://localhost:8080
SOCKET_CORS_ORIGINS=http://localhost:8080
```

## Run in Docker

```bash
docker compose up --build -d
```

Web app: `http://localhost:8080` (порт задаётся `WEB_PORT` в `.env`, см. `.env.example`)  
API: `http://localhost:5000/api/health` (в браузере веб-клиент ходит на `/api` через nginx того же порта)

Stop:

```bash
docker compose down
```

With DB reset:

```bash
docker compose down -v
```

## Local Linux development (without Docker)

Backend:

```bash
cd server
npm ci
npm run dev
```

Frontend:

```bash
npm ci
npm run dev
```

Vite proxies `/api` and `/socket.io` to `http://localhost:5000` by default. Override with:

```bash
VITE_API_TARGET=http://your-api-host:5000 npm run dev
```
# Bunker Boats

Система управления топливом и расходами для компании Bunker Boats.

## Требования

- Node.js 16+ 
- NPM 8+
- Windows 7/10/11

## Установка

1. Распакуйте архив в любую папку
2. Запустите `install.bat` для установки всех зависимостей

## Запуск приложения

1. Запустите `start.bat` для запуска всех компонентов приложения
2. Для остановки используйте `stop.bat` или закройте все окна

### Дополнительные скрипты

- `restart.bat` - полная остановка и перезапуск приложения
- `debug.bat` - запуск приложения с отображением всех логов
- `fix_ports.bat` - освобождение портов 5000 и 5173 при их блокировке
- `check_ports.bat` - проверка доступности необходимых портов

## Структура проекта

- `/server` - Backend API на Express.js с SQLite базой данных
- `/src` - Frontend на React.js
- `/public` - Статические файлы
- `/assets` - Иконки и медиа файлы

## Технологии

- Frontend: React.js, TypeScript, Vite, Ant Design
- Backend: Express.js, SQLite, Sequelize
- Desktop: Electron

## Особенности

- Расчет топлива для различных типов судов
- Ведение журнала заправок и расхода
- Управление транспортными средствами
- Учет смен и персонала
- Генерация отчетов

## Устранение неполадок

### Бесконечная загрузка приложения

1. Остановите все процессы с помощью `stop.bat`
2. Запустите `fix_ports.bat` для принудительного освобождения портов
3. Запустите `debug.bat` чтобы увидеть ошибки в консолях
4. Перезапустите с помощью `restart.bat`

### Белый экран в приложении

Убедитесь, что:
1. Оба сервера (Vite на порту 5173 и API на порту 5000) запущены
2. В папке `server/data` создана база данных SQLite
3. Файл `server/.env` существует с настройками подключения

### Ошибка "Cannot connect to server"

1. Остановите все процессы с помощью `stop.bat`
2. Запустите заново с помощью `start.bat`
3. Проверьте логи в `electron_log.txt`

### Проблемы с правами доступа

Запустите все bat-файлы от имени администратора.

## Логи и диагностика

- `electron_log.txt` - логи Electron-приложения
- Используйте DevTools (Ctrl+Shift+I) для просмотра консоли браузера

## Контакты

При возникновении проблем обращайтесь в службу поддержки. 