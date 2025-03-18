import * as Styled from './style'
import { AuthProps } from 'types/auth'
import { BrowserRouter as Router, Link } from 'react-router-dom'

const { VITE_APP_CDN_URL } = import.meta.env;

const Geneva: React.FC<AuthProps> = ({ BASE_URL }) => {
    return (
        <Router basename={BASE_URL.startsWith('./') ? '/' : BASE_URL}>
            <Styled.Main>
                <Styled.ImageGrid2 className='grid'>
                    <div>
                        <div style={{ backgroundImage: `url('${VITE_APP_CDN_URL}geneva/hackathon-dev-team.png')` }} />
                        <p>The Geneva team present at the EthGlobal Agentic A.I. hack in Feb 2025</p>
                    </div>
                    <div>
                        <div style={{ backgroundImage: `url('${VITE_APP_CDN_URL}geneva/engagement-farm.jpg')` }} />
                        <p>Welcome to the meadowverse... The Paddock is an MMO build with agile methodology and agentic A.I.</p>
                    </div>
                    <div>
                        <div style={{ backgroundImage: `url('${VITE_APP_CDN_URL}purr/kitty-news.jpg')` }} />
                        <p>The O.G. CryptoKitties block explorer kitty.news celebrates its 7th birthday!</p>
                    </div>
                </Styled.ImageGrid2>
                <h1>Cryptosystems</h1>
                <Styled.ImageGrid2 className='grid'>
                    <div>
                        <div style={{ backgroundImage: `url('${VITE_APP_CDN_URL}clients/kitties-tv/MrEth.png')` }} />
                        <p>The O.G. CryptoKitties block explorer kitty.news celebrates its 7th birthday!</p>
                    </div>
                    <div>
                        <div style={{ backgroundImage: `url('${VITE_APP_CDN_URL}geneva/horse21-and-horse88-daily-graze.png')` }} />
                        <p>Unreal Engine & A.I. are enabling small teams to ship faster and unlock web3's true potential</p>
                    </div>
                </Styled.ImageGrid2>
                <Styled.Grid>
                    
                </Styled.Grid>
            </Styled.Main>
        </Router>
    )
}

export default Geneva