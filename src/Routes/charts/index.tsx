import { useState, useEffect } from 'react'
import { SongInList, fetchCharts, rankThumbnails } from '../../App'
import { SongId, Regions, ChartResults } from '../../api/Client'

interface ChartsPageProps {
    queue: SongId[]
    setQueue: React.Dispatch<React.SetStateAction<SongId[]>>
    region: Regions
}

export function ChartsPage(props: ChartsPageProps) {
    const [charts, setCharts] = useState<ChartResults>()
    useEffect(() => {
        async function a() {
            let x = await fetchCharts(props.region)
            setCharts(x)
        }
        a()
    }, [])

    return (
        <div className='charts page'>
            <div className='hero'>
                <h2>Popular right now</h2>
            </div>
            <div className='chart-artists'>
                <h3>Artists: </h3>
                <div className='list'>
                    {charts?.artists.map((e) => {
                        let s1 = e.title.split(' • ')
                        let name = s1[0]
                        let subCount = s1[1].split(' ')[0]
                        if (e.thumbnails.length === 0) return <></>
                        return (
                            <div className='artist-in-list'>
                                <img
                                    src={rankThumbnails(e.thumbnails)[0].url}
                                    alt='thbnl'
                                    className='artist-thumbnail'
                                    loading='lazy'
                                />
                                <div className='artist-info'>
                                    <p>{name}</p>
                                    <p>{subCount}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className='chart-list'>
                <h3>Songs:</h3>
                <div className='list'>
                    {charts?.trending.map((e) => {
                        return (
                            <SongInList
                                title={e.title}
                                songId={e.id}
                                artist={e.subtitle}
                                artistId={e.subId}
                                playlist=''
                                liked={false}
                                thumbnailUrl={
                                    e.thumbnails.sort(
                                        (a, b) => a.height - b.height + a.width - b.width
                                    )[0].url
                                }
                                key={e.id}
                                queue={props.queue}
                                setQueue={props.setQueue}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
