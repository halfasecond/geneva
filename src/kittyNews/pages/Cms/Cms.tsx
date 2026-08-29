import axios from 'axios';
import React, { Fragment, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Cookies from 'js-cookie'
import {
    Copy, CopyElement, ImageElement, ParagraphElement, CodeElement,
    BlockquoteElement, ListElement, VideoElement, GridElement,
} from 'kittyNews/types/copy'
import AddCopy from 'kittyNews/components/AddCopy'
import Modal from 'kittyNews/components/Modal'
import SelectMenu from 'kittyNews/components/SelectMenu'
import Textarea from 'kittyNews/components/Textarea'
import VideoPlayer from 'kittyNews/components/VideoPlayer'
import { formatPublishedDate } from 'kittyNews/utils';
import * as Styled from './Cms.style'
import { CDN, MEDIA } from 'kittyNews/api'

const { VITE_APP_TOKEN_NAME } = import.meta.env

const copyTypes = ['p', 'h2', 'h3', 'blockquote', 'code', 'ul', 'img', 'grid', 'video']
const contentTypes = ['article', 'copy', 'news', 'post', 'review', 'tutorial']

const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
}

const Cms = ({ module, wallet, endpoint }: { module: string | undefined, wallet: string | undefined, endpoint: string }) => {
    const { slug } = useParams<{ slug?: string }>();
    const [cms, setCms] = useState<[Copy] | undefined>(undefined)
    const [copy, setCopy] = useState<Copy | undefined>(undefined)
    const [saving, setSaving] = useState<boolean>(false)
    const [authHeader, setAuthHeader] = useState<object | undefined>(undefined)
    const [modal, setModal] = useState<boolean>(false)
    const [tagInput, setTagInput] = useState<string>('')

    useEffect(() => {
        const storedToken = Cookies.get(VITE_APP_TOKEN_NAME)
        setAuthHeader({ headers: { Authorization: `Bearer ${storedToken}` } })
    }, [])

    useEffect(() => {
        const getCopys = async () => {
            try {
                const response = await axios.get<[Copy]>(`${endpoint}`);
                setCms(response.data);
            } catch (error) {
                console.error('Error fetching content:', error);
            }
        };
        getCopys();
    }, [])

    useEffect(() => {
        const getCopy = async () => {
            try {
                const response = await axios.get<Copy>(`${endpoint}/${slug}`);
                setCopy(response.data);
            } catch (error) {
                setCopy(undefined)
                console.error('Error fetching content:', error);
            }
        }
        if (slug) {
            getCopy()
        }

    }, [slug])

    useEffect(() => {
        if (slug !== undefined) {
            setCopy(undefined)
        }
    }, [slug])

    useEffect(() => {
        const save = async () => {
            if (copy) {
                try {
                    const { _id } = copy
                    const update = await axios.put(`${endpoint}/${_id}`, copy, authHeader)
                    if (update.status === 200) {
                        setSaving(false)
                    }
                } catch (e) {
                    console.log(e)
                }
            }
        };
        if (saving) {
            save()
        }
    }, [saving, copy, slug])

    const handlePublished = () => {
        setCopy((prevArticle) => prevArticle && ({ ...prevArticle, published: !prevArticle.published }))
    }

    const addCopy = (index: number) => {
        if (copy) {
            const newContent = [...copy.content];
            const newCopyElement: ParagraphElement = { p: '' }
            newContent.splice(index + 1, 0, newCopyElement)
            setCopy(prevArticle => prevArticle && ({ ...prevArticle, content: newContent }))
        }
    }

    const addItem = (index: number, subIndex: number) => {
        if (copy) {
            const newContent = [...copy.content];
            const currentElement = newContent[index];
            if ('ul' in currentElement) {
                const listElement = currentElement as ListElement;
                const newCopyElement = '';
                listElement.ul.splice(subIndex + 1, 0, newCopyElement);
            }
            if ('grid' in currentElement) {
                const gridElement = currentElement as GridElement
                const newGridItem = { img: { src: '', alt: '' }, h3: '' }
                gridElement.grid.splice(subIndex + 1, 0, newGridItem)
            }
            setCopy(prevArticle => prevArticle && ({ ...prevArticle, content: newContent }))
        }
    }

    const removeCopy = (index: number) => {
        const userConfirmed = window.confirm("Are you sure you want to delete this item?");
        if (userConfirmed && copy) {
            const newContent = [...copy.content];
            newContent.splice(index, 1)
            setCopy(prevArticle => prevArticle && ({ ...prevArticle, content: newContent }))
        }
    }

    const removeItem = (index: number, subIndex?: number) => {
        if (!copy) return;
        const newContent = [...copy.content]
        const currentElement = newContent[index]

        if ('ul' in currentElement) {
            const listElement = currentElement as ListElement;

            if (typeof subIndex === 'number' && listElement.ul[subIndex]) {
                if (!confirmRemoval("Are you sure you want to remove this item?")) {
                    return;
                }
                listElement.ul.splice(subIndex, 1);
            }
        }
        if ('grid' in currentElement) {
            const gridElement = currentElement as GridElement;
            const gridItem = gridElement.grid[subIndex || 0]; // Default to 0 if subIndex is undefined

            if (typeof subIndex === 'number') {
                const isNotEmpty = gridItem.h3 !== '' || gridItem.img.src !== '' || gridItem.img.alt !== '';
                if (isNotEmpty && !confirmRemoval("Are you sure you want to remove this item?")) {
                    return;
                }

                gridElement.grid.splice(subIndex, 1);
            }
        }
        setCopy(prevArticle => prevArticle && ({ ...prevArticle, content: newContent }));
    }

    const editTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCopy(prevArticle => prevArticle && ({ ...prevArticle, title: e.target.value }))
    }

    const editPublishedDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCopy(prevArticle => prevArticle && ({ ...prevArticle, publishedDate: e.target.value }))
    }

    const editImg = (e: React.ChangeEvent<HTMLInputElement>, copyType: 'alt' | 'src', index: number) => {
        if (copy) {
            const currentElement = copy.content[index];
            if ('img' in currentElement) {
                const newContent = [...copy.content];
                const imgElement = currentElement as ImageElement;
                imgElement.img[copyType] = e.target.value;
                newContent[index] = imgElement;
                setCopy(prevArticle => prevArticle && ({ ...prevArticle, content: newContent }));
            }
        }
    }

    const editVideo = (e: React.ChangeEvent<HTMLInputElement>, copyType: 'poster' | 'src', index: number) => {
        if (copy) {
            const currentElement = copy.content[index];
            if ('video' in currentElement) {
                const newContent = [...copy.content];
                const videoElement = currentElement as VideoElement;
                videoElement.video[copyType] = e.target.value;
                newContent[index] = videoElement;
                setCopy(prevArticle => prevArticle && ({ ...prevArticle, content: newContent }));
            }
        }
    }

    const editCopy = (_copy: string | { src: string; alt: string } | [string], index: number, subIndex?: number) => {
        if (!copy) return
        const newContent = [...copy.content];
        const currentElement = newContent[index];

        switch (true) {
            case 'p' in currentElement:
                if (typeof _copy === 'string') {
                    (currentElement as ParagraphElement).p = _copy;
                }
                break
            case 'h2' in currentElement:
                if (typeof _copy === 'string') {
                    (currentElement as any).h2 = _copy;
                }
                break

            case 'h3' in currentElement:
                if (typeof _copy === 'string') {
                    (currentElement as any).h3 = _copy;
                }
                break

            case 'blockquote' in currentElement:
                if (typeof _copy === 'string') {
                    (currentElement as BlockquoteElement).blockquote = _copy;
                }
                break

            case 'code' in currentElement:
                if (typeof _copy === 'string') {
                    (currentElement as CodeElement).code = _copy;
                }
                break

            case 'img' in currentElement:
                if (typeof _copy === 'object' && 'src' in _copy && 'alt' in _copy) {
                    (currentElement as ImageElement).img = _copy;
                }
                break

            case 'ul' in currentElement:
                if (typeof subIndex === 'number' && typeof _copy === 'string') {
                    const listElement = currentElement as ListElement;
                    if (subIndex >= 0 && subIndex < listElement.ul.length) {
                        listElement.ul[subIndex] = _copy;
                    }
                }
                break

            case 'grid' in currentElement:
                if (typeof subIndex === 'number') {
                    const gridElement = currentElement as GridElement;
                    const gridItem = gridElement.grid[subIndex];
                    if (typeof _copy === 'string') {
                        gridItem.h3 = _copy;
                    } else if (typeof copy === 'object' && 'src' in _copy && 'alt' in _copy) {
                        gridItem.img = _copy;
                    }
                }
                break
        }

        setCopy(prevArticle => prevArticle && ({ ...prevArticle, content: newContent }));
    }

    const editCopyType = (copyType: string, index: number) => {
        if (copy) {
            const currentElement = copy.content[index]
            const existingValue = Object.values(currentElement)[0]
            let newCopyElement: CopyElement;
            switch (copyType) {
                case 'p':
                    newCopyElement = { p: existingValue as string } as ParagraphElement;
                    break;

                case 'h2':
                    newCopyElement = { h2: existingValue as string } as any;
                    break;

                case 'h3':
                    newCopyElement = { h3: existingValue as string } as any;
                    break;

                case 'blockquote':
                    newCopyElement = { blockquote: existingValue as string } as BlockquoteElement;
                    break;

                case 'code':
                    newCopyElement = { code: existingValue as string } as CodeElement;
                    break;

                case 'img':
                    newCopyElement = {
                        img: (typeof existingValue === 'object' && existingValue !== null)
                            ? existingValue
                            : { src: '', alt: '' }
                    } as ImageElement;
                    break;

                case 'video':
                    newCopyElement = {
                        video: (typeof existingValue === 'object' && existingValue !== null)
                            ? existingValue
                            : { src: '', poster: '' }
                    } as VideoElement;
                    break;

                case 'ul':
                    newCopyElement = {
                        ul: (Array.isArray(existingValue) ? existingValue : [''])
                    } as ListElement;
                    break;

                case 'grid':
                    newCopyElement = {
                        grid: (Array.isArray(existingValue) ? existingValue : [{ h3: '', img: { src: '', alt: '' } }])
                    } as GridElement;
                    break;

                default:
                    console.error(`Unsupported copy type: ${copyType}`);
                    return;
            }

            const newContent = [...copy.content]
            newContent[index] = newCopyElement
            setCopy(prevArticle => prevArticle && ({ ...prevArticle, content: newContent }))
        }
    }

    const editContentType = (contentType: string) => copy && setCopy(prevCopy => prevCopy && ({ ...prevCopy, contentType }))

    const remove = async (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
        e.preventDefault()
        confirmRemoval("Are you sure you want to delete this content?")
        try {
            const _remove = await axios.delete(`${endpoint}/${id}`, authHeader)
            if (_remove.status === 200) {
                window.location.reload()
            }
        } catch (e) {
            console.log(e)
        }
    }

    const removeTag = (index: number) => {
        confirmRemoval("Are you sure you want to delete this tag?")
        if (copy) {
            const tags = [...copy.tags]
            tags.splice(index, 1)
            setCopy(prevCopy => prevCopy && ({ ...prevCopy, tags }))
        }
    }

    const confirmRemoval = (message: string) => {
        const isConfirmed = window.confirm(message);
        return isConfirmed
    }

    const handleInputTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, key: string, subKey?: string) => {
        const { value } = e.target;
        if (copy) {
            if (subKey) {
                setCopy(prevCopy => prevCopy && ({ ...prevCopy, [key]: { ...prevCopy[key], [subKey]: value } }))
            } else {
                setCopy(prevCopy => prevCopy && ({ ...prevCopy, [key]: value }))
            }

        }
    };

    const handleTagInputTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setTagInput(value)
    }

    const saveTag = () => {
        if (copy) {
            const tags = [...copy.tags]
            tags.push(tagInput)
            setCopy(prevCopy => prevCopy && ({ ...prevCopy, tags }))
            setTagInput('')
        }
    }

    const closeModal = () => setModal(false)

    const handleSave = () => setSaving(true)

    const openModal = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        e.preventDefault()
        setModal(true)
    }

    return (
        <>
            {modal && (
                <Modal onClose={closeModal} className={undefined}>
                    <AddCopy {...{ module, wallet }} onSaveSuccess={closeModal} />
                </Modal>
            )}
            <Styled.Div>
                <h1>
                    <Link to={'/cms'}><span>has</span>CMS</Link>
                    <Link to={'/'} onClick={(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => openModal(e)}>+ add new</Link>
                </h1>
                {!slug && (
                    contentTypes.map((contentType: string, i: number) =>
                        <Fragment key={i}>
                            <h2><span>has</span>{contentType}</h2>
                            {cms && cms.filter((copy) => copy.contentType === contentType).map((copy: Copy, i: number) => {
                                const { _id, title, contentType, slug, publishedDate } = copy
                                return (
                                    <div key={i}>
                                        <h3>
                                            <Link to={`/cms/${slug}`}>{title}<span>{formatPublishedDate(publishedDate)}</span></Link>
                                            <Link to={'/'} onClick={(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => remove(e, _id)}>delete</Link>
                                            <Link to={`/${contentType}/${copy.slug}`} target={'_blank'}>view</Link>
                                        </h3>
                                    </div>
                                )
                            })}
                        </Fragment>
                    )
                )}
                {slug && copy && (
                    <Styled.Form onSubmit={e => e.preventDefault()}>
                        <div>
                            <label>slug</label>
                            <div>
                                <b><Link to={`/${copy.contentType}/${copy.slug}`} target={'_blank'}>{copy.slug}</Link></b>
                            </div>
                        </div>
                        <div>
                            <label>author</label>
                            <div><b>{copy.author}</b></div>
                        </div>
                        <div>
                            <label>title</label>
                            <input type="text" value={copy.title} onChange={editTitle} disabled={saving} />
                        </div>
                        <div>
                            <label>type</label>
                            <SelectMenu
                                defaultValue={copy.contentType}
                                handleChange={(e: React.ChangeEvent<HTMLSelectElement>) => editContentType(e.target.value)}
                                disabled={saving}
                                options={contentTypes}
                            />
                        </div>
                        <div>
                            <label>published</label>
                            <input type="text" value={copy.publishedDate} onChange={editPublishedDate} disabled={saving} />
                        </div>
                        <div>
                            <label>thumbnail</label>
                            <input type="text" value={copy.thumbnail.src} onChange={e => handleInputTextChange(e, 'thumbnail', 'src')} disabled={saving} />
                        </div>
                        <div>
                            <label>thumbnail alt</label>
                            <input type="text" value={copy.thumbnail.alt} onChange={e => handleInputTextChange(e, 'thumbnail', 'alt')} disabled={saving} />
                        </div>
                        <img
                            src={CDN + copy.thumbnail.src}
                            alt={copy.thumbnail.alt}
                        />
                        <div>
                            <label>live</label>
                            <input type="checkbox" checked={copy.published} onChange={handlePublished} disabled={saving} />
                        </div>
                        <div>
                            <button onClick={handleSave} disabled={saving}>Save</button>
                        </div>
                        <h2>Copy</h2>
                        {copy.content.map((blob: CopyElement, i: number) => {
                            const Element = Object.keys(blob)[0] as keyof CopyElement;
                            if (Element === 'p') {
                                return (
                                    <div key={i}>
                                        <Label
                                            defaultValue={Element}
                                            handleChange={(e: React.ChangeEvent<HTMLSelectElement>) => editCopyType(e.target.value, i)}
                                            disabled={saving}
                                            options={copyTypes}
                                        />
                                        <Textarea
                                            content={(blob as ParagraphElement).p}
                                            onChange={_copy => editCopy(_copy, i, undefined)}
                                            disabled={saving}
                                        />
                                        <Menu index={i} {...{ addCopy, removeCopy }} disabled={saving} />
                                    </div>
                                )
                            }
                            if (Element === 'h2') {
                                return (
                                    <div key={i}>
                                        <Label
                                            defaultValue={Element}
                                            handleChange={(e: React.ChangeEvent<HTMLSelectElement>) => editCopyType(e.target.value, i)}
                                            disabled={saving}
                                            options={copyTypes}
                                        />
                                        <Textarea
                                            content={(blob as any).h2}
                                            onChange={_copy => editCopy(_copy, i, undefined)}
                                            disabled={saving}
                                        />
                                        <Menu index={i} {...{ addCopy, removeCopy }} disabled={saving} />
                                    </div>
                                )
                            }
                            if (Element === 'code') {
                                return (
                                    <div key={i}>
                                        <Label
                                            defaultValue={Element}
                                            handleChange={(e: React.ChangeEvent<HTMLSelectElement>) => editCopyType(e.target.value, i)}
                                            disabled={saving}
                                            options={copyTypes}
                                        />
                                        <Textarea
                                            content={(blob as CodeElement).code}
                                            onChange={_copy => editCopy(_copy, i, undefined)}
                                            disabled={saving}
                                        />
                                        <Menu index={i} {...{ addCopy, removeCopy }} disabled={saving} />
                                    </div>
                                )
                            }
                            if (Element === 'h3') {
                                return (
                                    <div key={i}>
                                        <Label
                                            defaultValue={Element}
                                            handleChange={(e: React.ChangeEvent<HTMLSelectElement>) => editCopyType(e.target.value, i)}
                                            disabled={saving}
                                            options={copyTypes}
                                        />
                                        <Textarea
                                            content={(blob as any).h3}
                                            onChange={_copy => editCopy(_copy, i, undefined)}
                                            disabled={saving}
                                        />
                                        <Menu index={i} {...{ addCopy, removeCopy }} disabled={saving} />
                                    </div>
                                )
                            }
                            if (Element === 'blockquote') {
                                return (
                                    <div key={i}>
                                        <Label
                                            defaultValue={Element}
                                            handleChange={(e: React.ChangeEvent<HTMLSelectElement>) => editCopyType(e.target.value, i)}
                                            disabled={saving}
                                            options={copyTypes}
                                        />
                                        <Textarea
                                            content={(blob as BlockquoteElement).blockquote}
                                            onChange={_copy => editCopy(_copy, i, undefined)}
                                            disabled={saving}
                                        />
                                        <Menu index={i} {...{ addCopy, removeCopy }} disabled={saving} />
                                    </div>
                                )
                            }
                            if (Element === 'img') {
                                return (
                                    <Fragment key={i}>
                                        <div >
                                            <Label
                                                defaultValue={Element}
                                                handleChange={(e: React.ChangeEvent<HTMLSelectElement>) => editCopyType(e.target.value, i)}
                                                disabled={saving}
                                                options={copyTypes}
                                            />
                                            <input
                                                type='text'
                                                value={(blob as ImageElement).img.src}
                                                onChange={e => editImg(e, 'src', i)}
                                            />
                                            <Menu index={i} {...{ addCopy, removeCopy }} disabled={saving} />
                                        </div>
                                        <div>
                                            <label>alt text</label>
                                            <input
                                                type='text'
                                                value={(blob as ImageElement).img.alt}
                                                onChange={e => editImg(e, 'alt', i)}
                                            />
                                        </div>
                                        <img
                                            src={CDN + (blob as ImageElement).img.src}
                                            alt={(blob as ImageElement).img.alt}
                                        />
                                    </Fragment>
                                );
                            }
                            if (Element === 'ul') {
                                return (
                                    <div key={i}>
                                        <Label
                                            defaultValue={Element}
                                            handleChange={(e: React.ChangeEvent<HTMLSelectElement>) => editCopyType(e.target.value, i)}
                                            disabled={saving}
                                            options={copyTypes}
                                        />
                                        <div>
                                            {(blob as ListElement).ul.map((li, q) => (
                                                <section key={`a${q}`}>
                                                    <input
                                                        type='text'
                                                        value={li}
                                                        onChange={e => editCopy(e.target.value, i, q)}
                                                    />
                                                    <Menu index={i} addCopy={() => addItem(i, q)} removeCopy={() => removeItem(i, q)} disabled={saving} />
                                                </section>
                                            ))}
                                        </div>
                                        <Menu index={i} {...{ addCopy, removeCopy }} disabled={saving} />
                                    </div>
                                );
                            }
                            if (Element === 'grid') {
                                return (
                                    <Fragment key={i}>
                                        <div>
                                            <Label
                                                defaultValue={Element}
                                                handleChange={(e: React.ChangeEvent<HTMLSelectElement>) => editCopyType(e.target.value, i)}
                                                disabled={saving}
                                                options={copyTypes}
                                            />
                                            <div>
                                                {(blob as GridElement).grid.map(({ img: { src, alt }, h3 }, q) => (
                                                    <section key={`a${q}`}>
                                                        <input
                                                            type='text'
                                                            value={h3}
                                                            onChange={e => editCopy(e.target.value, i, q)}
                                                        />
                                                        <Menu index={i} addCopy={() => addItem(i, q)} removeCopy={() => removeItem(i, q)} disabled={saving} />
                                                        <input
                                                            type='text'
                                                            value={src}
                                                            onChange={e => editCopy({ src: e.target.value, alt }, i, q)}
                                                        />
                                                        <input
                                                            type='text'
                                                            value={alt}
                                                            onChange={e => editCopy({ src, alt: e.target.value }, i, q)}
                                                        />
                                                        <img src={`${CDN}${src}`} alt={alt} />
                                                    </section>
                                                ))}
                                            </div>
                                            <Menu index={i} {...{ addCopy, removeCopy }} disabled={saving} />
                                        </div>
                                    </Fragment>
                                )
                            }
                            if (Element === 'video') {
                                return (
                                    <Fragment key={i}>
                                        <div >
                                            <Label
                                                defaultValue={Element}
                                                handleChange={(e: React.ChangeEvent<HTMLSelectElement>) => editCopyType(e.target.value, i)}
                                                disabled={saving}
                                                options={copyTypes}
                                            />
                                            <input
                                                type='text'
                                                value={(blob as VideoElement).video.src}
                                                onChange={e => editVideo(e, 'src', i)}
                                            />
                                            <Menu index={i} {...{ addCopy, removeCopy }} disabled={saving} />
                                        </div>
                                        <div>
                                            <label>poster</label>
                                            <input
                                                type='text'
                                                value={(blob as VideoElement).video.poster}
                                                onChange={e => editVideo(e, 'poster', i)}
                                            />
                                        </div>
                                        <div>
                                            <label></label>
                                            <VideoPlayer
                                                options={{
                                                    ...videoJsOptions,
                                                    sources: [{ src: MEDIA + (blob as VideoElement).video.src }],
                                                    poster: CDN + (blob as VideoElement).video.poster,
                                                }}
                                            />
                                        </div>

                                    </Fragment>
                                )
                            }
                        })}
                        <h2>Tags</h2>
                        <ul>
                            {copy.tags.map((tag: string, index: number) =>
                                <li key={index}>
                                    {tag}
                                    <span onClick={() => removeTag(index)}>x</span>
                                </li>
                            )}
                            <li>
                                <input type={'text'} value={tagInput} onChange={handleTagInputTextChange} />
                                <button onClick={saveTag}>save</button>
                            </li>
                        </ul>
                        <div>
                            <button onClick={handleSave} disabled={saving}>Save</button>
                        </div>
                    </Styled.Form>
                )}
            </Styled.Div>
        </>

    )
}

// Widgets

const Menu: React.FC<{
    index: number;
    addCopy: (index: number) => void;
    removeCopy: (index: number) => void;
    disabled: boolean;
}> = ({ index, addCopy, removeCopy, disabled }) => {
    return (
        <menu>
            <button onClick={() => addCopy(index)} {...{ disabled }}>+</button>
            <button onClick={() => removeCopy(index)} {...{ disabled }}>x</button>
        </menu>
    )
}

const Label: React.FC<{
    defaultValue: string;
    handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    disabled: boolean;
    options: string[];
}> = ({ defaultValue, handleChange, disabled, options }) => {
    return (
        <label>
            <SelectMenu {...{ defaultValue, handleChange, disabled, options }} />
        </label>
    );
};


export default Cms;
