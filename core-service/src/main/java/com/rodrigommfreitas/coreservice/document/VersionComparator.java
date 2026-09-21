package com.rodrigommfreitas.coreservice.document;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class VersionComparator {

    private static final Pattern TOKEN = Pattern.compile("\\d+|[A-Za-z]+");

    private VersionComparator() {
    }

    public static int compare(String a, String b) {
        List<String> ta = tokens(a);
        List<String> tb = tokens(b);
        int common = Math.min(ta.size(), tb.size());
        for (int i = 0; i < common; i++) {
            int c = compareToken(ta.get(i), tb.get(i));
            if (c != 0) return c;
        }
        return Integer.compare(ta.size(), tb.size());
    }

    private static int compareToken(String x, String y) {
        boolean xNum = Character.isDigit(x.charAt(0));
        boolean yNum = Character.isDigit(y.charAt(0));
        if (xNum && yNum) return new BigInteger(x).compareTo(new BigInteger(y));
        if (xNum) return -1;
        if (yNum) return 1;
        return x.compareToIgnoreCase(y);
    }

    private static List<String> tokens(String value) {
        List<String> result = new ArrayList<>();
        Matcher m = TOKEN.matcher(value == null ? "" : value);
        while (m.find()) result.add(m.group());
        return result;
    }
}
