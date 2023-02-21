FROM denoland/deno:alpine-1.10.3

EXPOSE 1990

WORKDIR /app

USER deno

COPY . .

RUN deno cache main.ts

CMD [ "deno task prod" ]