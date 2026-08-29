// @ts-nocheck
import React from 'react'
import inspect from 'kittyFamily/svg/inspect.svg'
import mystery from 'kittyFamily/svg/mystery.svg'
import './Search.css'

const Search = ({ kittyID, max, onSubmit, onChange, disabled }) =>
    <form className="kittySearch" onSubmit={e => { e.preventDefault(); onSubmit(kittyID) }}>
        #<input type="number" name="kittyID" value={kittyID} onChange={e => onChange(e)} />
        {disabled 
            ? <img src={inspect} alt={'Search'} className="submit disabled" />
            : <img src={inspect} alt={'Search'} className="submit" onClick={() => onSubmit(kittyID)} />}
        <img src={mystery} alt={'Mystery'} className="submit" onClick={() => onSubmit((Math.floor(Math.random() * max) + 1))} />
    </form>

export default Search
