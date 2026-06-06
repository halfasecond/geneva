import * as Styled from './Barcode.style'
import { AuthProps } from 'types/auth'
import { useEffect, useState } from 'react'
import { getContract } from '../../utils'
import { toWei } from 'web3-utils'
import BarcodeContract from '../../contracts/Barcode'
import Modal from '../../components/Modal'
import { getSVG } from 'src/utils/getImage';
import axios from 'axios'

interface NFT {
    tokenId: number;
    image: string;
    name?: string;
}

const { VITE_APP_ENDPOINT } = import.meta.env;

const { Core: { abi, addr } } = BarcodeContract
const barcode = getContract(abi, addr)

const Barcode: React.FC<AuthProps> = ({ loggedIn, handleSignIn }) => {
    const [minting, setMinting] = useState(false)
    const [nfts, setNfts] = useState<NFT[] | null>(null);
    const [modal, setModal] = useState(0)

    useEffect(() => {
        const getNfts = async () => {
            const { data } = await axios.get(`${VITE_APP_ENDPOINT}barcode/nfts`)
            setNfts(data)
        }
        if (!minting) {
            getNfts()
        }
    }, [minting])

    const handleMint = async () => {
        if (!loggedIn) {
            handleSignIn()
            return
        }

        setMinting(true)

        try {
            const value = toWei("6.235", "ether")
            const gas = await barcode.methods.mint(10).estimateGas({ from: loggedIn, value: value.toString() });
            const tx = await barcode.methods.mint(10).send({ from: loggedIn, value: value.toString(), gas: gas.toString() })

            console.log("Minted! Tx:", tx.transactionHash)
            alert(`Minted! Tx: ${tx.transactionHash}`)

        } catch (err: any) {
            console.error("Mint failed:", err)

            // Don't stringify React elements or circular objects!
            if (err.message?.includes("user rejected")) {
                alert("You rejected the transaction")
            } else if (err.message?.includes("insufficient funds")) {
                alert("Not enough ETH")
            } else {
                alert("Mint failed — check console")
            }
        } finally {
            setMinting(false)
        }
    }

    const handleModal = (tokenId) => {
        setModal(tokenId)
    }

    return (
        <>
            <Modal visible={modal > 0} close={() => setModal(0)}>
                <Styled.Modal>
                    {nfts && modal > 0 && (
                        (() => {
                            const nft = nfts.find(nft => nft.tokenId === modal);
                            if (!nft) return <div>NFT not found</div>;

                            return (
                                <Styled.Tile>
                                    <img src={nft.image} alt={`NFT #${modal}`} />
                                    <h3>Barcode #{nft.tokenId}</h3>
                                </Styled.Tile>
                                
                            )
                        })()
                    )}
                    
                </Styled.Modal>

            </Modal>
            <Styled.Main>
                <h1>Barcode</h1>
                <Styled.Canvas>
                    <img
                        src={`${import.meta.env.VITE_APP_CDN_URL}onGravity/barcode.png`}
                        alt="Barcode - Mandelbrot decoded"
                    />
                    {nfts && nfts.map((nft, i) => {
                        return (
                            <img
                                key={i}
                                src={getSVG(nft.image)}
                                style={{ marginLeft: nft.x + 'px', marginTop: nft.y + 'px' }}
                                onClick={() => handleModal(nft.tokenId)}
                            />
                        )
                    })}
                </Styled.Canvas>

                <h1>by kitty.international</h1>
                <p>
                    <button
                        onClick={handleMint}
                        disabled={minting}
                    >
                        {minting ? "Minting…" : "Mint: Ξ0.6235"}
                    </button>
                </p>
            </Styled.Main>
        </>
    )
}

export default Barcode