const { SmartAPI, WebSocket, WebSocketV2 } = require("smartapi-javascript");

function connect_webSoc() {
  let web_socket = new WebSocketV2({
    jwttoken:
      "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IlM0OTIzNzIiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJMFpESmxaRGd4WWkxaVlqZGxMVE14TTJZdFlUbGhOeTAyTkRJeU9UUXpabVE1TlRRaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqRWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlgwc0ltbHpjeUk2SW5SeVlXUmxYMnh2WjJsdVgzTmxjblpwWTJVaUxDSnpkV0lpT2lKVE5Ea3lNemN5SWl3aVpYaHdJam94TnpNek9UQTVNakUwTENKdVltWWlPakUzTXpNNE1qSTJNelFzSW1saGRDSTZNVGN6TXpneU1qWXpOQ3dpYW5ScElqb2lOVGxqWkdabE9EWXRNR00wWlMwMFpEY3pMV0UwTVRRdE1UWmtOVFF3TkdObFlUa3pJaXdpVkc5clpXNGlPaUlpZlEuZjgtWmtWTl85aTFPcEhERGFQWno4RHdxemZMWU9lSFFSU1VLN0lfVjhjZlFBd2FEOHJmUTY2Um5XZXQ4UEpZSmg5c3NoOFFrNTNhM3VFeXlDMlhhNEY3WmZDMUkyNDhyV2I3cGZJRS1pQlIyaS0yYWJOZGhsOU85Zi1NUjVTZXlvVk40TVppY1kxcmY2amw2NUZVT1hmQnJ0azNHZjF6MFgxWFRzN25jN2hjIiwiQVBJLUtFWSI6Ing2Q0FJeDJSIiwiaWF0IjoxNzMzODIyODE0LCJleHAiOjE3MzM5MDkyMTR9.sM5boAfN83sRkslGyOYJPaXrcZ_JzNMm5VlUpKnAzbtw5Ct06vTbY50jYllmh4yZB7oTW94cTpreVsZomw-ADg",
    apikey: "x6CAIx2R ",
    clientcode: "S492372",
    feedtype:
      "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IlM0OTIzNzIiLCJpYXQiOjE3MzM4MjI4MTQsImV4cCI6MTczMzkwOTIxNH0.qTjFbpITPCIxrgf4kyYTpUsvxXqIUDGMncqF407yI480ajcsTMbEr9a92ZWyXGZltljidsijzrwvruuT1xK3kw",
  });
  // for mode, action and exchangeTypes , can use values from constants file.
  web_socket.connect().then((res) => {
    let json_req = {
      correlationID: "correlation_id",
      action: 1,
      mode: 1,
      exchangeType: 1,
      tokens: ["17818"],
    };

    web_socket.fetchData(json_req);
    web_socket.on("tick", receiveTick);

    function receiveTick(data) {
      if (data && data.last_traded_price) {
        data.last_traded_price = data.last_traded_price / 100;
      }

      console.log("receiveTick:::::", data.last_traded_price);
    }
  });
}
export default connect_webSoc;
