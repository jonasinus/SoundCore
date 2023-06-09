import { useLocation } from 'react-router-dom'
import { PageProps } from '../../App'
import { useEffect, useState } from 'react'
import { ChannelData } from '../../api/Client'

export interface ChannelProps extends PageProps {}

export default function Channel(props: ChannelProps) {
    const location = useLocation()
    const [channelData, setChannelData] = useState<ChannelData>()

    useEffect(() => {
        let id = location.search
            .substring(1)
            .split('&')
            .find((e) => e.startsWith('id='))
            ?.substring(3)
        console.log(location.search.split('&'))
        if (id == undefined) return

        async function f() {
            let res: ChannelData = await (await fetch(props.soundCore.API_2_URL + 'channel/' + id, { referrerPolicy: 'no-referrer' })).json()
            console.log(res)
            setChannelData(res)
        }
        f()
    }, [])

    return <div>{channelData?.title || 'title'}</div>
}
