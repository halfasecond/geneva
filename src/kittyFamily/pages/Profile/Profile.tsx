// @ts-nocheck
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import logo from 'kittyFamily/svg/logo.svg'
import axios from 'axios'
import Search from 'kittyFamily/pages/Search'
import KittyPfp from 'kittyFamily/components/KittyPfp'
import Kitty from 'kittyFamily/components/Kitty'
import SearchBar from 'kittyFamily/components/SearchBar'
import Pagination from 'kittyFamily/components/Pagination'
import backSrc from 'kittyFamily/svg/back.svg'
import closeSrc from 'kittyFamily/svg/close.svg'
import paw from 'kittyFamily/svg/paw.svg'
import paw2 from 'kittyFamily/svg/paw2.svg'
import * as Styled from './Profile.style'
import { API } from 'kittyFamily/api'
import {
    acceptedInputForType,
    acceptedInputForCooldown,
    acceptedInputForMewtation,
    includeTermWhitelist,
    isValidSearchTerm,
    isValidIncludeTerm,
    isNumber,
    isWithinRange,
    searchTermWhitelist,
    orderByWhitelist,
    orderDirectionWhitelist,
    makeUrl,
    makeApiUrl,
    LIMIT,
} from 'kittyFamily/components/KittyHats/utils';

const Profile = ({ searchables, loggedIn, token, handleSignIn, user, checkToken }) => {
  const { profile } = useParams()
    const [modal, setModal] = useState(false)
    const [profileInfo, setProfileInfo] = useState(undefined)
    const [results, setResults] = useState(undefined)
    const [kitty, setKitty] = useState(undefined)
    const [follow, setFollow] = useState(false)
    const [followSuccess, setFollowSuccess] = useState(false)

    const modalOverlayRef = useRef(null)

    const handleOverlayClick = (event) => modalOverlayRef.current && event.target === modalOverlayRef.current && closeModal()
    const handleKeyDown = (event) => event.key === 'Escape' && closeModal() // Attach a keydown event listener to close the modal on pressing the "Escape" key

    const closeModal = () => {
        setKitty(undefined)
    }

    useEffect(() => {
        const followAttempt = async (user) => {
            try {
                const f = await axios.post(`${API}/kittyfamily-auth/follow`, { token, profile })
                checkToken()
            } catch (e) {
                console.log(e)
            }
        }
        if (follow) {
            if (loggedIn) {
                followAttempt(profile)
            } else {
                handleSignIn()
            }
        }
    }, [follow])



    useEffect(() => {
        const fetchProfiles = async () => {
          if (!profileInfo) {
            try {
                const response = await axios.get(`${API}/kittyfamily-accounts?accounts=[${profile}]`)
                if (response.data[0].avatar > 0) {
                    const { data: { kitties } } = await axios.get(`${API}/cryptokitties/nfts?search=id:${response.data[0].avatar}`)
                    const ids = kitties.map(({ tokenId }) => tokenId).join(',')
                    axios.get(`https://api.cryptokitties.co/v3/kitties?search=id:${ids}&limit=20`).then(async ckResult => {
                        const { data: { kitties: ckData } } = ckResult
                        const _kitties = kitties.map(kitty => {
                            return { ...ckData.find(ck => ck.id === kitty.tokenId), ...kitty };
                        })
                        setResults(_kitties)
                        setProfileInfo(response.data[0])
                    })
                } else {
                    setProfileInfo(response.data[0])
                }
              } catch (error) {
                console.error('Error fetching profiles:', error)
              }
          }
        }
    
        fetchProfiles()
    }, [profile, profileInfo])

    useEffect(() => {
        if (profileInfo) {
            setProfileInfo(undefined)
            setResults(undefined)
        }
    }, [profile])
    
    useEffect(() => {
        if (modal || kitty) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [modal, kitty])
    return (
        <>
            {modal && <Modal onClose={() => setModal(false)} {...{ loggedIn, searchables, token }} displayName={profileInfo.displayName ? profileInfo.displayName : ''} />}
            <Styled.Div>
                {profileInfo && (
                    <div>
                        {results && results.length > 0 ? (
                            <KittyPfp kitty={results[0]} bgColor={results[0].color} size={'160px'} />
                        ) : (
                            <img src={logo} alt={''} className={'placeholder'} />
                        )}
                        {loggedIn === profile ? (
                            <p onClick={() => setModal(true)}>edit</p>
                        ) : (
                            user && user.following && user.following.includes(profile.toLowerCase()) ? (
                                <Styled.FollowC2A role={'button'} onClick={() => setFollow(profileInfo.address)}>{'Following'} <img src={paw} alt={''} /></Styled.FollowC2A>
                            ) : (
                                <Styled.FollowC2A role={'button'} onClick={() => setFollow(profileInfo.address)}>{'Follow'} <img src={paw2} alt={''} /></Styled.FollowC2A>
                            )   
                            
                        )}
                        <h3>{profileInfo.displayName ? profileInfo.displayName : profileInfo.address}</h3>
                        <h3>balance: {profileInfo.balance === null ? '0' : profileInfo.balance} - birthed: <Link to={`/search?include=sale,sire,other&search=hatchedBy:${profileInfo.address}`}>{profileInfo.birthed === null ? '0' : profileInfo.birthed}</Link></h3>
                    </div>
                )}
                <Search {...{ searchables, profile }} account={{ wallet: loggedIn }} defaultInclude={{ sale: true,  sire: true, other: true }} />
            </Styled.Div>
        </>
        
    )
}

const Modal = ({ searchables, loggedIn, onClose, token, displayName }) => {
    const [total, setTotal] = useState(undefined)
    const [selectedKitty, setSelectedKitty] = useState(false)
    const [results, setResults] = useState(undefined)
    const [search, setSearch] = useState({ include: { sale: true, sire: true, other: true }, page: 1, orderBy: 'age', orderDirection: 'asc', account: loggedIn, virgin: false })
    const [saveAvatar, setSaveAvatar] = useState(false)
    const [saveAvatarSuccess, setSaveAvatarSuccess] = useState(false)
    const [saveForm, setSaveForm] = useState(false)
    const [saveFormSuccess, setSaveFormSuccess] = useState(false)
    const [formInfo, setFormInfo] = useState({ displayName })

    const modalOverlayRef = useRef(null)

    useEffect(() => {
        const getKitties = async () => {
            modalOverlayRef.current && modalOverlayRef.current.firstChild.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
            const { data: { kitties, total } } = await axios.get(`${API}/cryptokitties/nfts?${makeApiUrl(search)}`)
            const ids = kitties.map(({ tokenId }) => tokenId).join(',')
            axios.get(`https://api.cryptokitties.co/v3/kitties?search=id:${ids}&limit=20`).then(async ckResult => {
                const { data: { kitties: ckData } } = ckResult
                const _kitties = kitties.map(kitty => {
                    return { ...ckData.find(ck => ck.id === kitty.tokenId), ...kitty };
                })
                setResults(_kitties)
                setTotal(total)
            })
        }
        if (loggedIn) {
            getKitties()
        }
    }, [loggedIn, search])

    const handleOverlayClick = (event) => modalOverlayRef.current && event.target === modalOverlayRef.current && onClose()
    const handleKeyDown = (event) => event.key === 'Escape' && onClose() // Attach a keydown event listener to close the modal on pressing the "Escape" key

    const specialTerms = ['fancy', 'exclusive', 'specialedition', 'shinyfancy']
    const addTerm = (description, sType) => {
        const _search = { ...search }
        _search['page'] = 1
        if (sType) {
            if (specialTerms.includes(sType)) {
                specialTerms.forEach((type) => {
                    if (_search[type] && sType !== _search[type]) delete _search[type]
                })
                _search.type = sType
                _search[sType] = description
                _search['mewtation'] && delete _search['mewtation']
                _search['terms'] && delete _search['terms']
                addSearch(_search)
            } else {
                if (searchTermWhitelist.includes(sType)) {
                    _search[sType] = description
                    addSearch(_search)
                } else {
                }
            }
        } else {
            const searchable = searchables.find((s) => s.description === description)
            if (searchable) {
                _search.terms = _search.terms || []
                delete _search['type']
                specialTerms.forEach((type) => {
                    delete _search[type]
                })
                const sameTypeTerms = searchables
                    .filter(({ type }) => type === searchable.type)
                    .map((s) => s.description)
                _search.terms = _search.terms.filter((term) => !sameTypeTerms.includes(term))
                _search.terms.push(description)
            }
            addSearch(_search)
        }
    }

    const formatSearchInputDisplay = (_search) =>
        formatTags(_search)
            .map((s) => {
                if (s === 'terms') {
                    return search[s].join(' ');
                } else {
                    if (!(s === 'pto' || s === 'pfrom' || (s === 'type' && search[s] === 'normal'))) {
                        return [...specialTerms, 'purrstige'].includes(s) ? `${search[s]}` : `${s}:${search[s]}`;
                    }
                }
                return undefined;
            })
            .filter((item) => item !== undefined)
            .join(' ');

    const formatTags = (_search) =>
        Object.keys(search).filter(
            (s) =>
                (searchTermWhitelist.includes(s) &&
                    !['virgin'].includes(s) &&
                    !(['account'].includes(s) && _search[s] === loggedIn)) ||
                s === 'terms',
        )

    const handleSearchSubmit = (searchQuery) => {
        const _search = { ...search }
        _search.terms = []
        const searchTerms = searchQuery.trim().split(/\s+/)
        searchTerms.forEach((term) => {
            const searchable = searchables.find((s) => s.description === term)
            if (searchable) {
                const sameTypeTerms = searchables
                    .filter(({ type }) => type === searchable.type)
                    .map((s) => s.description)
                if (specialTerms.includes(searchable.type)) {
                    const termType = searchable.type
                    _search[termType] = term
                } else {
                    _search.terms = _search.terms.filter((term) => !sameTypeTerms.includes(term))
                    _search.terms.push(term)
                }
                specialTerms.forEach((type) => {
                    delete _search[type]
                })
            } else {
                const [termType, termValue] = term.split(':')
                if (isValidSearchTerm(termType)) {
                    if (specialTerms.includes(termType)) {
                        specialTerms.forEach((type) => {
                            if (_search[type] && termType !== _search[type]) delete _search[type]
                        })
                        _search.type = termType
                        _search[termType] = termValue
                        _search['mewtation'] && delete _search['mewtation']
                        _search['terms'] && delete _search['terms']
                    } else {
                        if (searchTermWhitelist.includes(termType)) {
                            _search[termType] = termValue
                        }
                    }
                }
            }
        })
        addSearch(_search)
    }

    const handleSearchClear = () => {
        const _search = {}
        _search.include = search.include
        _search.orderBy = search.orderBy
        _search.orderDirection = search.orderDirection
        _search.virgin = search.virgin
        _search.page = 1
        if (search.account === loggedIn) {
            _search.account = search.account
        }
        addSearch(_search)
    }

    const addSearch = (_search) => setSearch(_search)

    useEffect(() => {
        document.addEventListener('click', handleOverlayClick)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('click', handleOverlayClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose])

    useEffect(() => {
        if (saveAvatar && loggedIn) { // todo - maybe add logic that this isn't their existing avatar?
            const updateAvatar = async (tokenId) => {
                try {
                    const u = await axios.post(`${API}/kittyfamily-auth/avatar`, { token, tokenId })
                    setSaveAvatarSuccess(true)
                } catch (e) {
                    console.log(e)
                }
            }
            updateAvatar(saveAvatar)
        }
    }, [saveAvatar])

    useEffect(() => {
        if (saveForm && loggedIn) { // todo - maybe add logic that this isn't their existing avatar?
            const updateInfo = async () => {
                const u = await axios.post(`${API}/kittyfamily-auth/info`, { token, formInfo })
                setSaveFormSuccess(true)
            }
            updateInfo()
        }
    }, [saveForm, formInfo])

    return (
        <Styled.Modal ref={modalOverlayRef} wider={!selectedKitty}>
            <div>
                <img className={'close'} src={closeSrc} alt="" onClick={onClose} />
                <img className={'back'} src={backSrc} alt="" onClick={() => setSelectedKitty(false)} />
                {selectedKitty ?
                    (
                        <Styled.SelectedKitty>
                            <KittyPfp kitty={selectedKitty} bgColor={selectedKitty.color} size={'160px'} />
                            <h3>#{selectedKitty.tokenId}{selectedKitty.name && ` - ${selectedKitty.name}`}</h3>
                            <p>Use the save button if you want to use this kitty as your PFP:</p>
                            <div className={saveAvatarSuccess ? 'success' : undefined}>
                                <button onClick={() => setSaveAvatar(selectedKitty.tokenId)} disabled={saveAvatar || saveAvatarSuccess ? true : false}>Save</button>
                            </div>
                            <hr />
                            <h3>Share some deets:</h3>
                            <input type={'text'} value={formInfo.displayName} placeholder={'Display name'} onChange={e => setFormInfo({ ...formInfo, displayName: e.target.value })} />
                            <div className={saveFormSuccess ? 'success' : undefined}>
                                <button onClick={() => setSaveForm(formInfo)} disabled={saveForm ? true : false}>Save</button>
                            </div>
                            <hr />
                            {/* <h3>GTFO...</h3>
                            <p>Use this button if you want kitty.family to remove all information stored on our databases about you</p>
                            <div className={saveAvatarSuccess ? 'success' : undefined}>
                                <button onClick={() => console.log('remove info')}>Remove all info</button>
                            </div>
                            
                            <hr /> */}
                        </Styled.SelectedKitty> 
                    ) : (
                        <>
                            <Styled.Grid>
                                <header>
                                    <h3>Select a Kitty to use as your kitty.family pfp:</h3>

                                    <SearchBar
                                        suggestions={searchables}
                                        searchQuery={formatSearchInputDisplay(search)}
                                        onSearchSuggestionSelect={({ description }) => addTerm(description)}
                                        onSearchSubmit={handleSearchSubmit}
                                        onSearchClear={handleSearchClear}
                                        disabled={!search}
                                        {...{ location }}
                                    />
                                </header>
                                {results && results.map((kitty, i) =>
                                    <Kitty key={i} {...{ kitty }}
                                        c2aPosition={'top'}
                                        showMewts={true}
                                        showInfo={false} bgColor={kitty.color} getInfo={() => setSelectedKitty(kitty)}
                                    />
                                )}
                                {total && <Pagination
                                    showPages
                                    currentPage={search.page}
                                    totalPages={Math.ceil(total / 20)}
                                    maxPages={10}
                                    onChange={page => setSearch({ ...search, page })}
                                />}
                            </Styled.Grid>


                        </>
                    )
                }
            </div>
        </Styled.Modal>
    )
}

export default Profile