# Keep UTF-8 ECI opt-in

QRCodeSDK encodes octet segments as UTF-8 but does not emit ECI assignment 26 unless the developer
enables it. The default relies on scanner heuristics for non-ASCII payloads to preserve current and
legacy scanner compatibility and avoid the extra 12 bits, accepting that the character encoding is
not explicit in the symbol.
