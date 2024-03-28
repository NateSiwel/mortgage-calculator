import dynamic from 'next/dynamic';

const MortgageCalculator = dynamic(
  () => import('@/components/MortgageCalculator'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12 pt-12 ">
      <div className='w-full max-w-3xl'>
        <h1 className="text-4xl font-bold mt-4">Mortgage Calculator</h1>
        <div className='mt-2'>
          <MortgageCalculator/>
        </div>
      </div>
    </main>
  )
}
