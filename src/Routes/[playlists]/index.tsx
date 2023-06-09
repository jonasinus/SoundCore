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
                    <p onClick={() => props.soundCore.addPublicPlaylistToQueue(e.id)}>{e.title}</p>
                ))}
            </div>
            <div className='private'>
                <h3>private:</h3>
                {props.soundCore.playlists.map((e) => (
                    <p onClick={() => props.soundCore.addPrivatePlaylistToQueue(e.title)}>{e.title}</p>
                ))}
            </div>
        </div>
    )
}
