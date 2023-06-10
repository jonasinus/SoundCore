import { useState } from 'react'
import { PageProps } from '../../App'
import './search.css'
import { SearchResultPlaylist, SearchResultStream, SearchResults, SearchTypes } from '../../api/Client'

interface SearchpageProps extends PageProps {}

export default function Search(props: SearchpageProps) {
    const [query, setQuery] = useState('')
    const [extendedSearchEnabled, setExtendedSearchEnabled] = useState(false)
    const [searchFilter, setSearchFilter] = useState<SearchTypes>('songs')
    const [searchResults, setSearchResults] = useState<SearchResults>()

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault()
        let requestUrl = `${props.soundCore.API_URL}search?filter=${extendedSearchEnabled ? 'all' : searchFilter}&q=${query}`
        console.log(requestUrl)

        let res = await (await fetch(requestUrl, { referrerPolicy: 'no-referrer' })).json()
        setSearchResults(res)
    }
    // Type guard for SearchResultStream
    function isSearchResultStream(item: any): item is SearchResultStream {
        return item.type === 'stream'
    }

    // Type guard for SearchResultPlaylist
    function isSearchResultPlaylist(item: any): item is SearchResultPlaylist {
        return item.type === 'playlist'
    }

    return (
        <div className='page search'>
            <h2>search somethin</h2>
            <form onSubmit={handleSubmit}>
                <input type='text' onInput={(ev) => setQuery(ev.currentTarget.value)} />
                <div className='filters'>
                    <div className='general'>
                        <label htmlFor='songs'>
                            <input type='radio' name='general' id='songs' />
                            <p>songs</p>
                        </label>
                        <label htmlFor='albums'>
                            <input type='radio' name='general' id='albums' />
                            <p>albums</p>
                        </label>
                        <label htmlFor='artists'>
                            <input type='radio' name='general' id='artists' />
                            <p>artists</p>
                        </label>
                        <label htmlFor='playlists'>
                            <input type='radio' name='general' id='playlists' />
                            <p>playlists</p>
                        </label>
                    </div>
                    <label htmlFor='extended'>
                        <input type='checkbox' id='extended' onInput={(ev) => setExtendedSearchEnabled(ev.currentTarget.checked)} />
                        <p>extended</p>
                    </label>
                </div>
            </form>
            <div className='results'>
                {searchResults?.items.map((item) => {
                    if (isSearchResultPlaylist(item)) {
                        return <div className='playlist'>playlist: {item.name}</div>
                    }
                    if (isSearchResultStream(item)) {
                        return <div className='stream'>stream: {item.title}</div>
                    }
                })}
            </div>
        </div>
    )
}
