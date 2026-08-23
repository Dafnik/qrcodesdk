# Do not adjust risky image overlays

When a developer supplies a center image, QRCodeSDK renders valid option values without rejecting
the overlay or automatically changing its size or error correction level. This preserves explicit
control and the current renderer contract, while accepting that the default image overlay can reduce
scan reliability and that developers must test customized output.
