import Report from '../components/Report';
import { SAMPLE_ANSWERS, SAMPLE_DEEP } from '../sampleData';

export default function Sample() {
  return (
    <div>
      <div className="bg-[#3d0b26] px-6 py-3 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#edc840]">
          Sample report — this is the level of depth every woman receives
        </p>
      </div>
      <Report answers={SAMPLE_ANSWERS} deep={new URLSearchParams(window.location.search).has('fallback') ? null : SAMPLE_DEEP} />
    </div>
  );
}
