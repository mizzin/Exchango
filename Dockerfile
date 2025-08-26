FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# nodemon 글로벌 설치 (선택)
RUN npm install && npm install cors

# 기존
# CMD ["node", "app.js"]

# 변경
CMD ["npm", "run", "dev"]
