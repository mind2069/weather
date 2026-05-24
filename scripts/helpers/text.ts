export class TextHelper
{
    private static readonly NORMALIZE_ACCENT_FROM =  "àáâãäåèéêëìíîïòóôõöùúûüçñ";
    private static readonly NORMALIZE_ACCENT_TO = "aaaaaa" + "eeee" + "iiii" + "ooooo" + "uuuu" + "cn";

    private static PgTranslate( value: string, from: string, to: string ): string
    {
        let out = "";

        for ( let i = 0; i < value.length; i++ )
        {
            const ch = value[ i ]!;
            const idx = from.indexOf( ch );

            if ( idx < 0 )
            {
                out += ch;
            }
            else if ( idx < to.length )
            {
                out += to[ idx ]!;
            }
        }

        return out;
    }

    public static Normalize( text: string | null | undefined ): string
    {
        const coalesced = text ?? "";
        const translated = TextHelper.PgTranslate(coalesced, TextHelper.NORMALIZE_ACCENT_FROM, TextHelper.NORMALIZE_ACCENT_TO);
        const lowered = translated.toLowerCase();

        return lowered.replace( /[^a-z0-9]/g, "" );
    }

    public static Numeric( text: string | null | undefined ): string
    {
        const coalesced = text ?? "";

        return coalesced.replace( /[^0-9]/g, "" );
    }
}
