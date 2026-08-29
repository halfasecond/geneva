import {
    EmailIcon, EmailShareButton,
    FacebookIcon, FacebookShareButton,
    LinkedinIcon, LinkedinShareButton,
    RedditIcon, RedditShareButton,
    TelegramIcon, TelegramShareButton,
    TwitterIcon, TwitterShareButton,
    WhatsappIcon, WhatsappShareButton
} from "react-share"

const ShareWidget = ({ size, url }: { size: number, url: string }) =>
    <>
        <EmailShareButton {...{ url }}>
            <EmailIcon {...{ size }} />
        </EmailShareButton>
        <FacebookShareButton {...{ url }}>
            <FacebookIcon {...{ size }} />
        </FacebookShareButton>
        <LinkedinShareButton {...{ url }}>
            <LinkedinIcon {...{ size }} />
        </LinkedinShareButton>
        <RedditShareButton {...{ url }}>
            <RedditIcon {...{ size }} />
        </RedditShareButton>
        <TelegramShareButton {...{ url }}>
            <TelegramIcon {...{ size }} />
        </TelegramShareButton>
        <TwitterShareButton {...{ url }}>
            <TwitterIcon {...{ size }} />
        </TwitterShareButton>
        <WhatsappShareButton {...{ url }}>
            <WhatsappIcon {...{ size }} />
        </WhatsappShareButton>
        
    </>

export default ShareWidget