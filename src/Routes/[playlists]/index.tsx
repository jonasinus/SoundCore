import { useEffect } from 'react'
import { PageProps } from '../../App'

export interface PlayListPageProps extends PageProps {}

export default function Platlists(props: PlayListPageProps) {
    useEffect(() => {
        console.log(props.soundCore.playlists, props.soundCore.publicPlaylists)
    }, [props.soundCore.playlists, props.soundCore.publicPlaylists])

    return (
        <div className='page playlists'>
            <h2>playlists</h2>
            <div className='public'>
                <h3>public:</h3>
                {props.soundCore.publicPlaylists.map((e) => (
                    <div key={e.id}>
                        <p
                            onClick={() => {
                                props.soundCore.addPublicPlaylistToQueue(e.id)
                            }}>
                            {e.title}
                        </p>
                        <button
                            onClick={() => {
                                props.soundCore.getPlaylistHandler()?.l(true, e.id)
                                console.log('a')
                            }}>
                            ×
                        </button>
                    </div>
                ))}
                {props.soundCore.publicPlaylists.length === 0 ? <>copy your favorite playlists!</> : <></>}
            </div>
            <div className='private'>
                <h3>private:</h3>
                {props.soundCore.playlists.map((e) => (
                    <div key={e.title}>
                        <p onClick={() => props.soundCore.addPrivatePlaylistToQueue(e.title)}>{e.title}</p>
                        <button onClick={() => props.soundCore.getPlaylistHandler()?.removePLaylist(false, e.title)}>×</button>
                    </div>
                ))}
                {props.soundCore.playlists.length === 0 ? <>create your own playlists!</> : <></>}
            </div>
        </div>
    )
}
