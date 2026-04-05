export type QuantumSeed = {
  bitstring: string;
  numericSeed: number;
};

export async function getQuantumSeed(): Promise<QuantumSeed> {
  // MVP 단계:
  // 현재는 Math.random()으로 mock quantum bitstring 생성
  // 추후에는 IonQ simulator / QPU 결과 bitstring으로 대체 예정

  const bitLength = 16;
  let bitstring = "";

  for (let i = 0; i < bitLength; i++) {
    bitstring += Math.random() > 0.5 ? "1" : "0";
  }

  const numericSeed = parseInt(bitstring, 2);

  return {
    bitstring,
    numericSeed,
  };
}

/*
TODO (future quantum integration):
- IonQ simulator에 작은 회로 제출
- measurement 결과 bitstring 반환
- 해당 bitstring을 numericSeed로 변환
- entanglement map generation에 사용

예상 흐름:
1. Bell / random circuit 실행
2. measured bitstring 수신
3. bitstring -> seed 변환
4. seed 기반으로 cluster pairing 결정
*/