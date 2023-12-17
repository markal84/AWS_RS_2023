import {
  APIGatewayTokenAuthorizerEvent,
  Callback,
  Context,
  Handler,
} from "aws-lambda";

export const handler: Handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  _ctx: Context,
  callback: Callback
) => {
  console.log({ event });

  const generatePolicy = (
    principalId: string,
    effect: string,
    resource: string
  ) => {
    return {
      principalId,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: effect,
            Resource: resource,
          },
        ],
      },
    };
  };

  try {
    const token = event.authorizationToken;
    console.log("auth token: ", { token });

    if (!token || !token.includes("Basic")) {
      throw new Error("Unauthorized");
    }

    const credentials = token.split(" ")[1];
    if (!credentials) {
      throw new Error("Unauthorized");
    }
    const [username, password] = Buffer.from(credentials, "base64")
      .toString()
      .split(":");

    const storedPassword = process.env[username];

    if (!storedPassword || storedPassword !== password) {
      throw new Error("Unauthorized");
    }
    return callback(null, generatePolicy("user", "Allow", event.methodArn));
  } catch (err) {
    console.log("error", err);
    return callback(null, generatePolicy("user", "Deny", event.methodArn));
  }
};
