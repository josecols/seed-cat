import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_MAX_AGE, CookieKey, SENTENCE_RANGE } from '@/app/lib/defaults';
import { v4 as uuid4 } from 'uuid';

const COOKIE_OPTIONS = { maxAge: COOKIE_MAX_AGE };

export const config = {
  matcher: ['/translate/:path*', '/review/:path*'],
};

export function proxy(request: NextRequest) {
  let response = NextResponse.next();

  response = setUserId(request, response);
  response = validateRange(request, response);

  return response;
}

function getParams(pathname: string) {
  const match = pathname.match(/^\/(translate|review)\/([^\/]+)\/([^\/]+)/);
  
  if (match) {
    return {
      type: match[1],
      pair: match[2],
      index: match[3]
    };
  }
  
  return null;
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

  const params = getParams(request.nextUrl.pathname);
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
