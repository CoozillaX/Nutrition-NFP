const crypto = require("crypto");
const SECRET = "d34ce0ae-16ba-4868-bf86-9fcb042d0219";

function _sign(data) {
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");
  return sig;
}

function sign(data) {
  const sig = _sign(data);
  return data + "." + sig;
}

function verify(signedData) {
  const parts = signedData.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid signed data format");
  }
  const data = parts[0];
  const sig = parts[1];
  const expectedSig = _sign(data);
  if (sig !== expectedSig) {
    throw new Error("Invalid signature");
  }
  return data;
}

module.exports = {
  sign,
  verify
};
