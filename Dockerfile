FROM node

EXPOSE 80
WORKDIR /app/

COPY package.json /app/
RUN apt-get update && apt-get install -y httpie vim
RUN npm install

COPY README.md /app/
COPY cal.json /app/
COPY favicon.png /app/
COPY edit.html index.html cal.html /app/
COPY app.js /app/

CMD ["npm", "run" "json"]
CMD ["npm", "run" "dev"]
CMD ["npm", "run" "app"]
