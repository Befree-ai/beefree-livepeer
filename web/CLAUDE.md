@AGENTS.md
## Payment Flow
Fan subscribes → Razorpay order created → payment webhook → MongoDB updated → JWT issued → premium content unlocked

## Video Flow
Creator uploads → Livepeer asset created → TUS upload → playbackId saved in MongoDB → JWT gates premium content

## Auth Flow
Privy login → user webhook → create/find user in MongoDB → role assigned (fan/creator)