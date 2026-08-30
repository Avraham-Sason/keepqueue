import { Spinner } from '@/components/ui/spinner'

function loader() {
  return (
    <div className="_center w-screen h-screen">
        <Spinner className="size-40" />
    </div>
  )
}

export default loader