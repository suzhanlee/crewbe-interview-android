export abstract class BaseAirline {
  abstract readonly name: string;
  abstract readonly questions: string[];
}

export class KoreanAir extends BaseAirline {
  readonly name = '대한항공';
  readonly questions = [
    "자기소개 및 지원 동기를 말씀해 주세요.",
    "승무원으로서 필요한 역량이 무엇이라고 생각하십니까?",
    "기내에서 승객 간 갈등 상황이 발생했을 때 어떻게 대처하시겠습니까?",
    "대한항공의 서비스 중 기억에 남는 것을 말해보세요.",
    "최근에 다녀온 여행지 중 인상 깊었던 곳은 어디인가요?",
    "영화는 어떤 장르를 좋아하시나요?",
    "어제 밤 잠을 이루기 전에 무슨 생각을 하셨나요?",
    "오늘 면접장에 오는 길 컨디션이 어땠나요?",
    "전공을 살려 취업을 했는데 왜 승무원으로 지원하셨나요?",
    "서비스 관련 경력이 있으신가요?"
  ];
}

export class AsianaAirlines extends BaseAirline {
  readonly name = '아시아나항공';
  readonly questions = [
    "아시아나항공에 지원한 동기는 무엇인가요?",
    "LCC와 FSC 승무원의 공통점과 차이점은 무엇이라고 생각하십니까?",
    "나이 많은 사람들과 의사소통 경험이 있으신가요?",
    "승무원이 미래에도 유망한 직업이라고 생각하십니까?",
    "자신이 제공한 서비스 중 가장 기억에 남는 것은 무엇인가요?",
    "학생과 직장인의 차이를 권한과 책임을 사용하여 설명해 주세요.",
    "최근에 읽은 책은 무엇인가요?",
    "상사가 부당한 지시를 했을 때 어떻게 하시겠습니까?",
    "동아리 활동은 무엇을 하셨나요?",
    "갈등을 해결한 경험을 말해보세요."
  ];
}

export class JejuAir extends BaseAirline {
  readonly name = '제주항공';
  readonly questions = [
    "제주항공을 선택한 이유는 무엇인가요?",
    "저비용항공사(LCC)와 대형항공사(FSC)의 차이점은 무엇이라고 생각하십니까?",
    "제주항공의 기업 문화에 대해 어떻게 이해하고 계신가요?",
    "서비스 업계에서의 어려움을 어떻게 극복하셨는지요?",
    "제주항공의 노선 중 가보고 싶은 곳과 그 이유는 무엇인가요?",
    "팀 프로젝트에서 맡았던 역할과 성과에 대해 이야기해 주세요.",
    "제주항공의 슬로건이나 미션에 대해 알고 계신가요?",
    "고객의 불만을 처리한 경험이 있다면 공유해 주세요.",
    "제주항공의 경쟁사와 비교하여 어떤 점이 우수하다고 생각하십니까?",
    "입사 후 제주항공에서 이루고 싶은 목표는 무엇인가요?"
  ];
}

export class TwayAir extends BaseAirline {
  readonly name = '티웨이항공';
  readonly questions = [
    "티웨이항공에 지원하게 된 동기는 무엇인가요?",
    "티웨이항공의 서비스 철학에 대해 어떻게 생각하십니까?",
    "승무원으로서의 체력 관리는 어떻게 하고 계신가요?",
    "티웨이항공의 주요 취항지 중 가보고 싶은 곳은 어디인가요?",
    "서비스 직무에서의 갈등 상황을 어떻게 해결하셨는지요?",
    "티웨이항공의 브랜드 이미지에 대해 어떻게 생각하십니까?",
    "다양한 문화의 승객을 대하는 데 필요한 역량은 무엇이라고 생각하십니까?",
    "티웨이항공의 사회공헌 활동에 대해 알고 계신가요?",
    "서비스 개선을 위해 제안하고 싶은 아이디어가 있다면 말씀해 주세요.",
    "입사 후 티웨이항공에서 어떤 역할을 하고 싶으신가요?"
  ];
}

export class JinAir extends BaseAirline {
  readonly name = '진에어';
  readonly questions = [
    "진에어에 지원한 이유는 무엇인가요?",
    "진에어의 기업 가치에 대해 어떻게 이해하고 계신가요?",
    "승무원으로서의 시간 관리는 어떻게 하고 계신가요?",
    "진에어의 기내 서비스 중 개선하고 싶은 부분이 있다면 무엇인가요?",
    "팀워크를 발휘하여 문제를 해결한 경험이 있다면 공유해 주세요.",
    "진에어의 경쟁사와 비교하여 어떤 점이 차별화된다고 생각하십니까?",
    "서비스 제공 시 가장 중요하게 생각하는 가치는 무엇인가요?",
    "진에어의 최신 뉴스나 이벤트에 대해 알고 계신가요?",
    "어려운 고객을 응대했던 경험이 있다면 말씀해 주세요.",
    "입사 후 진에어에서의 포부를 말씀해 주세요."
  ];
}

export class AirBusan extends BaseAirline {
  readonly name = '에어부산';
  readonly questions = [
    "자기소개를 해주세요.",
    "에어부산에 지원한 동기는 무엇인가요?",
    "부산에서 근무하게 될 텐데, 부산에 대해 어떻게 생각하십니까?",
    "본인의 장점과 단점을 말씀해 주세요.",
    "팀 내 갈등 상황을 어떻게 해결하셨는지 경험을 공유해 주세요.",
    "최근 항공업계 이슈 중 관심 있게 본 내용은 무엇인가요?",
    "스트레스를 어떻게 해소하시는지요?",
    "에어부산의 경쟁사와 비교하여 어떤 점이 우수하다고 생각하십니까?",
    "서비스 직무에서 가장 중요한 것은 무엇이라고 생각하십니까?",
    "입사 후 에어부산에서 이루고 싶은 목표는 무엇인가요?"
  ];
}

export class AirSeoul extends BaseAirline {
  readonly name = '에어서울';
  readonly questions = [
    "자기소개를 해주세요.",
    "에어서울에 지원한 이유는 무엇인가요?",
    "서울을 기반으로 한 항공사에서 근무하는 것에 대해 어떻게 생각하십니까?",
    "본인의 서비스 경험 중 가장 기억에 남는 것은 무엇인가요?",
    "팀워크를 발휘하여 문제를 해결한 경험이 있다면 공유해 주세요.",
    "에어서울의 경쟁사와 비교하여 어떤 점이 차별화된다고 생각하십니까?",
    "스트레스를 어떻게 관리하시는지요?",
    "서비스 제공 시 가장 중요하게 생각하는 가치는 무엇인가요?",
    "최근에 읽은 책이나 감명 깊게 본 영화는 무엇인가요?",
    "입사 후 에어서울에서 어떤 역할을 하고 싶으신가요?"
  ];
}

export class EastarJet extends BaseAirline {
  readonly name = '이스타항공';
  readonly questions = [
    "자기소개를 해주세요.",
    "이스타항공에 지원하게 된 동기는 무엇인가요?",
    "저비용항공사(LCC)에서 근무하는 것에 대해 어떻게 생각하십니까?",
    "본인의 강점과 약점을 말씀해 주세요.",
    "서비스 업계에서의 어려움을 어떻게 극복하셨는지요?",
    "이스타항공의 노선 중 가보고 싶은 곳과 그 이유는 무엇인가요?",
    "팀 프로젝트에서 맡았던 역할과 성과에 대해 이야기해 주세요.",
    "고객의 불만을 처리한 경험이 있다면 공유해 주세요.",
    "이스타항공의 경쟁사와 비교하여 어떤 점이 우수하다고 생각하십니까?",
    "입사 후 이스타항공에서 이루고 싶은 목표는 무엇인가요?"
  ];
}

export class AirPremia extends BaseAirline {
  readonly name = '에어프레미아';
  readonly questions = [
    "자기소개를 해주세요.",
    "에어프레미아에 지원한 이유는 무엇인가요?",
    "에어프레미아의 비전과 가치에 대해 어떻게 생각하십니까?",
    "본인의 서비스 경험 중 가장 기억에 남는 것은 무엇인가요?",
    "팀 내 갈등을 해결한 경험이 있다면 공유해 주세요.",
    "에어프레미아의 경쟁사와 비교하여 어떤 점이 차별화된다고 생각하십니까?",
    "스트레스를 어떻게 해소하시는지요?",
    "서비스 제공 시 가장 중요하게 생각하는 가치는 무엇인가요?",
    "최근 항공업계 이슈 중 관심 있게 본 내용은 무엇인가요?",
    "입사 후 에어프레미아에서 어떤 역할을 하고 싶으신가요?"
  ];
}

export class FlyGangwon extends BaseAirline {
  readonly name = '플라이강원';
  readonly questions = [
    "자기소개를 해주세요.",
    "플라이강원에 지원하게 된 동기는 무엇인가요?",
    "강원도를 기반으로 한 항공사에서 근무하는 것에 대해 어떻게 생각하십니까?",
    "본인의 강점과 약점을 말씀해 주세요.",
    "서비스 업계에서의 어려움을 어떻게 극복하셨는지요?",
    "플라이강원의 노선 중 가보고 싶은 곳과 그 이유는 무엇인가요?",
    "팀 프로젝트에서 맡았던 역할과 성과에 대해 이야기해 주세요.",
    "고객의 불만을 처리한 경험이 있다면 공유해 주세요.",
    "플라이강원의 경쟁사와 비교하여 어떤 점이 우수하다고 생각하십니까?",
    "입사 후 플라이강원에서 이루고 싶은 목표는 무엇인가요?"
  ];
}

export const AIRLINES: BaseAirline[] = [
  new KoreanAir(),
  new AsianaAirlines(),
  new JejuAir(),
  new TwayAir(),
  new JinAir(),
  new AirBusan(),
  new AirSeoul(),
  new EastarJet(),
  new AirPremia(),
  new FlyGangwon()
];

export function getRandomQuestion(airline: BaseAirline): string {
  const randomIndex = Math.floor(Math.random() * airline.questions.length);
  return airline.questions[randomIndex];
} 