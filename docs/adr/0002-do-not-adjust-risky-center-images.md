# Do not adjust risky center images

When a developer supplies a center image, QRCodeSDK renders valid option values without rejecting
the center image or automatically changing its size or error correction level. This preserves explicit
control and the current renderer contract, while accepting that the default center image can reduce
scan reliability and that developers must test customized output.
