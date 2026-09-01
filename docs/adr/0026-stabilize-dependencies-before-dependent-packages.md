# Stabilize dependencies before dependent packages

A QRCodeSDK package reaches 1.0 only after every required QRCodeSDK dependency and peer has a stable
compatible major. Core therefore stabilizes first, Browser and Node may follow, and framework
packages and CLI may then stabilize independently, preventing a 1.x package from relying on a 0.x
SDK contract that may still break in a minor release.
