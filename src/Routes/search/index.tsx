import { useState, useRef, useEffect } from 'react'
import {
    fetchSearchResults,
    fetchExtendedSearchResults,
    filterTitle,
    truncateTitle
} from '../../App'
import { SongId, SearchResults, SearchTypes } from '../../api/Client'

interface SearchPageProps {
    queue: SongId[]
    setQueue: React.Dispatch<React.SetStateAction<SongId[]>>
}

export function SearchPage(props: SearchPageProps) {
    const [searchResults, setSearchResults] = useState<SearchResults | undefined>(undefined)
    const [filter, setFilter] = useState<SearchTypes>('songs')
    const [extendedSearch, setExtendedSearch] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [filtersCollapsed, setFiltersCollapsed] = useState(false)

    useEffect(() => {
        console.log('new search results:', searchResults)
    }, [searchResults])

    useEffect(() => {
        if (filter != 'songs') setExtendedSearch(false)
        async function refetch() {
            if (inputRef.current && inputRef.current.value != '') {
                let res
                if (!extendedSearch) res = await fetchSearchResults(inputRef.current.value, filter)
                if (extendedSearch) res = await fetchExtendedSearchResults(inputRef.current.value)
                setSearchResults(res)
            }
        }
        refetch()
    }, [filter])

    return (
        <div className='page search'>
            <div className='search-widget'>
                <input type='text' placeholder='what are you looking for?' ref={inputRef} />
                <button
                    type='submit'
                    onClick={async () => {
                        let res
                        let query = inputRef && inputRef.current ? inputRef.current.value : ''
                        if (!extendedSearch) res = await fetchSearchResults(query, filter)
                        if (extendedSearch) res = await fetchExtendedSearchResults(query)
                        setSearchResults(res)
                    }}>
                    →
                </button>
            </div>
            <div className='filters-wrapper'>
                <div className='filters'>
                    <div className='filterctrl'>
                        <h3>Filters:</h3>
                        <button
                            title='collapse filter array'
                            className={
                                'collapse-filters-button ' +
                                (filtersCollapsed ? 'collapsed' : 'nope')
                            }
                            onClick={() => setFiltersCollapsed(!filtersCollapsed)}>
                            {filtersCollapsed ? '↓' : '↑'}
                        </button>
                    </div>
                    <div className='main-filters'>
                        <label className='filter' htmlFor='songs'>
                            <input
                                type='radio'
                                value='songs'
                                name='filter'
                                id='songs'
                                defaultChecked
                                onChange={(e) => {
                                    if (e.currentTarget.value) setFilter('songs')
                                }}
                            />
                            <p>songs</p>
                        </label>
                        <label className='filter' htmlFor='albums'>
                            <input
                                type='radio'
                                value='albums'
                                name='filter'
                                id='albums'
                                onChange={(e) => {
                                    if (e.currentTarget.value) setFilter('albums')
                                }}
                            />
                            <p>albums</p>
                        </label>
                        <label className='filter' htmlFor='artists'>
                            <input
                                type='radio'
                                value='artists'
                                name='filter'
                                id='artists'
                                onChange={(e) => {
                                    if (e.currentTarget.value) setFilter('artists')
                                }}
                            />
                            <p>artists</p>
                        </label>
                        <label className='filter' htmlFor='playlists'>
                            <input
                                type='radio'
                                value='playlists'
                                name='filter'
                                id='playlists'
                                onChange={(e) => {
                                    if (e.currentTarget.value) setFilter('playlists')
                                }}
                            />
                            <p>playlists</p>
                        </label>
                    </div>
                    <div className='additional-filters'>
                        {filter == 'songs' ? (
                            <>
                                <label className='extended-search' htmlFor='extended-search'>
                                    <input
                                        type='checkbox'
                                        id='extended-search'
                                        onChange={(e) => setExtendedSearch(e.currentTarget.checked)}
                                    />
                                    <p>extended search {extendedSearch ? '✓' : '?'}</p>
                                </label>
                            </>
                        ) : (
                            <></>
                        )}
                    </div>
                </div>
            </div>
            <div className='results'>
                {searchResults?.items.map((e) => {
                    //console.log(e)
                    if (e.type != 'channel') {
                        return (
                            <div
                                key={e.url}
                                onClick={() => {
                                    props.setQueue([...props.queue, e.url.split('=')[1]])
                                }}>
                                <img src={e.thumbnail} alt='img' />
                                <div className='infos' title={e.title + ' | ' + e.uploaderName}>
                                    <p className='title'>{truncateTitle(filterTitle(e.title))}</p>
                                    <p className='artist'>{e.uploaderName}</p>
                                    <p className='id'>{e.url.split('=')[1]}</p>
                                </div>
                                <button className='like-button'>
                                    <img src='./heart.svg' alt='like' />
                                </button>
                            </div>
                        )
                    }
                })}
            </div>
        </div>
    )
}
