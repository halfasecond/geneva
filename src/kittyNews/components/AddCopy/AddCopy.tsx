import axios from 'axios'
import { API } from 'kittyNews/api'
import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy } from 'kittyNews/types/copy';
import { Form } from 'kittyNews/pages/Cms/Cms.style';
import * as Styled from './AddCopy.style';

const { VITE_APP_TOKEN_NAME } = import.meta.env

const contentTypes = ['article', 'blog', 'copy', 'news', 'review']

const AddCopy = ({ module, wallet, onSaveSuccess }: { module: string | undefined, wallet: string | undefined, onSaveSuccess: () => void }) => {
    const [saving, setSaving] = useState(false)
    const [authHeader, setAuthHeader] = useState<object | undefined>(undefined)
    const [copy, setCopy] = useState<Partial<Copy>>({
        slug: '',
        title: '',
        author: wallet,
        publishedDate: '',
        contentType: contentTypes[0],
        content: [{ p: '' }]
    })
    const navigate = useNavigate()

    useEffect(() => {
        const storedToken = Cookies.get(VITE_APP_TOKEN_NAME)
        setAuthHeader({ headers: { Authorization: `Bearer ${storedToken}` } })
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCopy(prevCopy => ({ ...prevCopy, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSaving(true)
    }

    const endpoint = module === ''
        ? `${API}/cms`
        : `${API}/${module}/cms`

    useEffect(() => {
        const save = async () => {
            try {
                const _save = await axios.post(`${endpoint}`, copy, authHeader)
                if (_save.status === 201) {
                    navigate(`/cms/${copy.slug}`)
                    onSaveSuccess()
                }
            } catch (e) {
                console.log(e)
            }
        }
        saving && save()
    }, [saving, copy])

    return (
        <Styled.Div>
            <h2>Add new content</h2>
            <Form onSubmit={handleSubmit}>
                <div>
                    <label>Slug <i>*</i></label>
                    <input
                        type="text"
                        name="slug"
                        value={copy.slug}
                        onChange={handleChange}
                        disabled={saving}
                    />
                </div>
                <div>
                    <label>Title <i>*</i></label>
                    <input
                        type="text"
                        name="title"
                        value={copy.title}
                        onChange={handleChange}
                        disabled={saving}
                    />
                </div>
                <div>
                    <label>Content Type</label>
                    <select
                        name="contentType"
                        value={copy.contentType}
                        onChange={handleChange}
                        disabled={saving}
                    >
                        {contentTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Published Date</label>
                    <input
                        type="text"
                        name="publishedDate"
                        value={copy.publishedDate}
                        onChange={handleChange}
                        disabled={saving}
                    />
                </div>
                <div>
                    <button type="submit" disabled={saving}>Save</button>
                </div>
            </Form>
        </Styled.Div>
    );
};

export default AddCopy;
