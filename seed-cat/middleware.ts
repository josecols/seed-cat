import { NextRequest, NextResponse, URLPattern } from 'next/server';
import { COOKIE_MAX_AGE, CookieKey, SENTENCE_RANGE } from '@/app/lib/defaults';
import { v4 as uuid4 } from 'uuid';

const COOKIE_OPTIONS = { maxAge: COOKIE_MAX_AGE };
const PATTERNS: [URLPattern, typeof patternHandler][] = [
  [new URLPattern({ pathname: '/translate/:pair/:index' }), patternHandler],
  [new URLPattern({ pathname: '/review/:pair/:index' }), patternHandler],
];

export const config = {
  matcher: ['/translate/:path*', '/review/:path*'],
};

export function middleware(request: NextRequest) {
  let response = NextResponse.next();

  response = setUserId(request, response);
  response = validateRange(request, response);

  return response;
}

function getParams(url: string) {
  const input = url.split('?')[0];

  for (const [pattern, handler] of PATTERNS) {
    if (!pattern) {
      continue;
    }

    const patternResult = pattern.exec(input);
    if (patternResult !== null && 'pathname' in patternResult) {
      return handler(patternResult);
    }
  }
}

function patternHandler(result: ReturnType<URLPattern['exec']>) {
  if (result) {
    return result.pathname.groups;
  }
}

function setUserId(request: NextRequest, response: NextResponse) {
  const uid = request.nextUrl.searchParams.get('uid');
  const cookie = request.cookies.get(CookieKey.UserIdentifier);

  if (uid) {
    response.cookies.set(CookieKey.UserIdentifier, uid, COOKIE_OPTIONS);
  } else if (!cookie) {
    response.cookies.set(CookieKey.UserIdentifier, uuid4(), COOKIE_OPTIONS);
  }

  return response;
}

function validateRange(request: NextRequest, response: NextResponse) {
  const rangeParams = request.nextUrl.searchParams.get('range');
  const cookie = request.cookies.get(CookieKey.SentenceRange);
  let [lower, upper] = (cookie?.value ?? SENTENCE_RANGE).split('-').map(Number);

  if (rangeParams?.includes('-')) {
    [lower, upper] = rangeParams.split('-').map(Number);

    if (Number.isInteger(lower) && Number.isInteger(upper)) {
      response.cookies.set(
        CookieKey.SentenceRange,
        `${lower}-${upper}`,
        COOKIE_OPTIONS
      );
    }
  }

  const params = getParams(request.nextUrl.href);
  if (params?.pair && params?.index) {
    const index = Number(params.index);
    if (index < lower || index > upper) {
      return NextResponse.redirect(
        new URL(`/translate/${params.pair}/out-of-range`, request.url)
      );
    }
  }

  return response;
}
