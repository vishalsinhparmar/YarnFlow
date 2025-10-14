@echo off
echo Starting YarnFlow Server in Development Mode...
set NODE_ENV=development
nodemon index.js
pause
