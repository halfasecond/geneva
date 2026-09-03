// @ts-nocheck
import { useParams } from 'react-router-dom'
import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import Kitty from 'kittyFamily/components/Kitty'
import Logo from 'kittyFamily/components/Logo'
import KittyModal from 'kittyFamily/components/KittyModal'
import * as Styled from './FamilyTree.style'
import { API } from 'kittyFamily/api'

const FamilyTree = ({ handlePurchase }) => {
  const { id } = useParams()
  const [kitties, setKitties] = useState(undefined)
  const [hats, setHats] = useState([])
  const [modal, setModal] = useState(false)

  useEffect(() => {
    modal
        ? document.body.style.overflow = 'hidden'
        : document.body.style.overflow = 'auto'
    return () => {
        document.body.style.overflow = 'auto'
    }
  }, [modal])

  useEffect(() => {
    if (id) {
      setKitties(undefined); // Reset kitties when id changes
      setModal(false)
      axios.get(`${API}/cryptokitties/family?search=id:${id}`)
        .then(({ data }) => {
          const ids = data.kitties.map(({ tokenId }) => tokenId).join(',');
          axios.get(`https://api.cryptokitties.co/v3/kitties?search=id:${ids}&limit=15`)
            .then(ckResult => {
              const { data: { kitties: ckData } } = ckResult;
              const _kitties = data.kitties.map(kitty => {
                const ck = ckData.find(row => Number(row.id) === Number(kitty.tokenId))
                return {
                  ...ck,
                  ...kitty,
                  enhanced_cattributes: kitty.enhanced_cattributes?.length
                    ? kitty.enhanced_cattributes
                    : (ck?.enhanced_cattributes || []),
                }
              })
              setKitties(_kitties)
            }).catch(error => console.error('Error fetching CryptoKitties data:', error))
        }).catch(error => console.error('Error fetching initial kitty:', error))
    }
  }, [id]); // Listen for changes in the id

  const getKitty = (_kitties) => _kitties.find(({ tokenId }) => tokenId.toString() === id)
  const getParent = (_kitties, type) => _kitties.find(({ tokenId }) => tokenId === getKitty(_kitties)[`${type}Id`])
  const getAncestor = (_kitties, _id) => _kitties.find(({ tokenId }) => tokenId === _id)
  const getHats = (_hats, kitty) => _hats.filter(({ tokenId }) => tokenId === kitty?.tokenId)

  return (
    <>
      {modal && (
        <KittyModal onClose={() => setModal(false)} {...{ handlePurchase }} {...modal } currentKittyId={id} />
      )}
      <Styled.Main className={kitties && getKitty(kitties)?.color}>
        {kitties !== undefined && getKitty(kitties) && (
          <Styled.Section>
            <Styled.Div className={'row1'}>
              <Kitty 
                kitty={getKitty(kitties)}
                hats={getHats(hats, getKitty(kitties))}
                getInfo={() => setModal({ kitty: getKitty(kitties), hats: getHats(hats, getKitty(kitties)) })}
                {...{ handlePurchase }}
              />
            </Styled.Div>
            {getKitty(kitties)?.gen > 0 ? (
              <>
                <Styled.Hr style={{ width: '50%'}} />
                <Styled.Div className={'row2'}>
                  <Kitty
                    kitty={getParent(kitties, 'matron')}
                    hats={getHats(hats, getParent(kitties, 'matron'))}
                    getInfo={() => setModal({ kitty: getParent(kitties, 'matron'), hats: getHats(hats, getParent(kitties, 'matron')) })}
                    {...{ handlePurchase }}
                  />
                  <Logo />
                  <Kitty
                    kitty={getParent(kitties, 'sire')}
                    hats={getHats(hats, getParent(kitties, 'sire'))}
                    getInfo={() => setModal({ kitty: getParent(kitties, 'sire'), hats: getHats(hats, getParent(kitties, 'sire')) })}
                    {...{ handlePurchase }} 
                  />
                </Styled.Div>
              </>
            ) : (
              <Styled.Div className={'row2'}>
                <Logo />
              </Styled.Div>
            )}
            {getKitty(kitties)?.gen > 0 && (getParent(kitties, 'matron')?.gen > 0 || getParent(kitties, 'sire')?.gen > 0) &&
              <>
                <div style={{ display: 'flex' }}>
                  <Styled.Hr style={{ width: '25%', opacity: getParent(kitties, 'matron')?.gen > 0 ? 1 : 0}} />
                  <Styled.Hr style={{ width: '25%', opacity: getParent(kitties, 'sire')?.gen > 0 ? 1 : 0}} />
                </div>
                <Styled.Div className={'row3'}>
                  {getParent(kitties, 'matron')?.gen > 0 ?
                    <>
                      <Kitty 
                        kitty={getAncestor(kitties, getParent(kitties, 'matron').matronId)}
                        hats={getHats(hats, getAncestor(kitties, getParent(kitties, 'matron').matronId))}
                        getInfo={() => setModal({ kitty: getAncestor(kitties, getParent(kitties, 'matron').matronId), hats: getHats(hats, getAncestor(kitties, getParent(kitties, 'matron').matronId))})}
                        {...{ handlePurchase }} 
                      />
                      <Kitty 
                        kitty={getAncestor(kitties, getParent(kitties, 'matron').sireId)}
                        hats={getHats(hats, getAncestor(kitties, getParent(kitties, 'matron').sireId))}
                        getInfo={() => setModal({ kitty: getAncestor(kitties, getParent(kitties, 'matron').sireId), hats: getHats(hats, getAncestor(kitties, getParent(kitties, 'matron').sireId)) })}
                        {...{ handlePurchase }}
                      />
                    </>
                  : <><div /><div /></>}
                  {getParent(kitties, 'sire')?.gen > 0 ?
                    <>
                    <Kitty 
                        kitty={getAncestor(kitties, getParent(kitties, 'sire').matronId)}
                        hats={getHats(hats, getAncestor(kitties, getParent(kitties, 'sire').matronId))}
                        getInfo={() => setModal({ kitty: getAncestor(kitties, getParent(kitties, 'sire').matronId), hats: getHats(hats, getAncestor(kitties, getParent(kitties, 'sire').matronId)) })}
                        {...{ handlePurchase }} 
                      />
                      <Kitty 
                        kitty={getAncestor(kitties, getParent(kitties, 'sire').sireId)}
                        hats={getHats(hats, getAncestor(kitties, getParent(kitties, 'sire').sireId))}
                        getInfo={() => setModal({ kitty: getAncestor(kitties, getParent(kitties, 'sire').sireId), hats: getHats(hats, getAncestor(kitties, getParent(kitties, 'sire').sireId)) })}
                        {...{ handlePurchase }}
                      />
                    </>
                  : <><div /><div /></>}
                </Styled.Div>
                <div style={{ display: 'flex' }}>
                  <Styled.Hr style={{ width: '12.5%', opacity: getAncestor(kitties, getParent(kitties, 'matron').matronId)?.gen > 0 ? 1 : 0}} />
                  <Styled.Hr style={{ width: '12.5%', opacity: getAncestor(kitties, getParent(kitties, 'matron').sireId)?.gen > 0 ? 1 : 0}} />
                  <Styled.Hr style={{ width: '12.5%', opacity: getAncestor(kitties, getParent(kitties, 'sire').matronId)?.gen > 0 ? 1 : 0}} />
                  <Styled.Hr style={{ width: '12.5%', opacity: getAncestor(kitties, getParent(kitties, 'sire').sireId)?.gen > 0 ? 1 : 0}} />
                </div>
                <Styled.Div className={'row4'}>
                  {getAncestor(kitties, getParent(kitties, 'matron').matronId)?.gen > 0 ?
                    <>
                      <Kitty 
                        kitty={getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').matronId).matronId)}
                        hats={getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').matronId).matronId))}
                        getInfo={() => setModal({ 
                          kitty: getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').matronId).matronId),
                          hats: getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').matronId).matronId))
                        })}
                        {...{ handlePurchase }}
                      />
                      <Kitty
                        kitty={getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').matronId).sireId)}
                        hats={getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').matronId).sireId))}
                        getInfo={() => setModal({ 
                          kitty: getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').matronId).sireId),
                          hats: getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').matronId).sireId))
                        })}
                        {...{ handlePurchase }}
                      />
                    </>
                  : <><div /><div /></>
                  }
                  {getAncestor(kitties, getParent(kitties, 'matron').sireId)?.gen > 0 ?
                    <>
                      <Kitty 
                        kitty={getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').sireId).matronId)}
                        hats={getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').sireId).matronId))}
                        getInfo={() => setModal({ 
                          kitty: getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').sireId).matronId),
                          hats: getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').sireId).matronId))
                        })}
                        {...{ handlePurchase }} 
                      />
                      <Kitty 
                        kitty={getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').sireId).sireId)}
                        hats={getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').sireId).sireId))}
                        getInfo={() => setModal({ 
                          kitty: getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').sireId).sireId),
                          hats: getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'matron').sireId).sireId))
                        })}
                        {...{ handlePurchase }}
                      />
                    </>
                  : <><div /><div /></>}
                  {getAncestor(kitties, getParent(kitties, 'sire').matronId)?.gen > 0 ?
                    <>
                      <Kitty
                        kitty={getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').matronId).matronId)}
                        hats={getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').matronId).matronId))}
                        getInfo={() => setModal({ 
                          kitty: getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').matronId).matronId),
                          hats: getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').matronId).matronId))
                        })}
                        {...{ handlePurchase }}
                      />
                      <Kitty
                        kitty={getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').matronId).sireId)}
                        hats={getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').matronId).sireId))}
                        getInfo={() => setModal({ 
                          kitty: getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').matronId).sireId),
                          hats: getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').matronId).sireId))
                        })}
                        {...{ handlePurchase }}
                      />
                    </>
                  : <><div /><div /></>
                  }
                  {getAncestor(kitties, getParent(kitties, 'sire').sireId)?.gen > 0 ?
                    <>
                      <Kitty
                        kitty={getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').sireId).matronId)}
                        hats={getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').sireId).matronId))}
                        getInfo={() => setModal({ 
                          kitty: getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').sireId).matronId),
                          hats: getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').sireId).matronId))
                        })}
                        {...{ handlePurchase }}
                      />
                      <Kitty 
                        kitty={getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').sireId).sireId)}
                        hats={getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').sireId).sireId))}
                        getInfo={() => setModal({ 
                          kitty: getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').sireId).sireId),
                          hats: getHats(hats, getAncestor(kitties, getAncestor(kitties, getParent(kitties, 'sire').sireId).sireId))
                        })}
                        {...{ handlePurchase }}
                      />
                    </>
                  : <><div /><div /></>}
                </Styled.Div>
              </>
            }
          </Styled.Section>
        )}
      </Styled.Main>
    </>
    
  )
}

export default FamilyTree
